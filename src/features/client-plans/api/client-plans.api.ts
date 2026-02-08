import { supabase } from "@/integrations/supabase/client";
import type { ClientPlanWithTemplate, AssignTemplateInput, SaveAsTemplateInput } from "@/types/template";
import type { ClientPlan, ClientPlanWithActive } from "@/features/client-plans/types";
import { getTemplate } from "@/features/templates/api/templates.api";
import { assignPlanToClient } from "@/features/clients/api/client-fsm.api";
import { getCoachClientId } from "@/lib/coach-client";

/**
 * Get all client plans with active status resolved from client_plan_assignments.
 * Source of truth: client_plan_assignments.status = 'ACTIVE'
 */
export async function getClientPlansWithActive(clientId: string): Promise<ClientPlanWithActive[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const coachClientId = await getCoachClientId(clientId);

  // Source of truth: client_plan_assignments
  const { data: activeAssignment, error: assignError } = await supabase
    .from("client_plan_assignments")
    .select("plan_id")
    .eq("coach_id", user.id)
    .eq("client_id", clientId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (assignError) throw assignError;
  const activePlanId = activeAssignment?.plan_id ?? null;

  // Fetch all non-deleted plans
  const { data, error } = await supabase
    .from("client_plans")
    .select("*")
    .eq("coach_client_id", coachClientId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  // Fetch templates for plans with derived_from_template_id
  const plansWithTemplates = await Promise.all(
    (data || []).map(async (plan: any) => {
      let template = null;
      if (plan.derived_from_template_id) {
        try {
          const templateData = await getTemplate(plan.derived_from_template_id);
          template = { id: templateData.id, name: templateData.name };
        } catch {
          // Template may have been deleted
        }
      }
      return {
        ...plan,
        template,
        isActiveForClient: plan.id === activePlanId,
      } as ClientPlanWithActive;
    })
  );

  return plansWithTemplates;
}

/**
 * @deprecated Use getClientPlansWithActive instead
 */
export async function getClientPlans(clientId: string) {
  const coachClientId = await getCoachClientId(clientId);

  const { data, error } = await supabase
    .from("client_plans")
    .select("*")
    .eq("coach_client_id", coachClientId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  // Fetch templates for plans with derived_from_template_id
  const plansWithTemplates = await Promise.all(
    (data || []).map(async (plan: any) => {
      if (plan.derived_from_template_id) {
        try {
          const template = await getTemplate(plan.derived_from_template_id);
          return { ...plan, template } as ClientPlanWithTemplate;
        } catch {
          return plan as ClientPlan;
        }
      }
      return plan as ClientPlan;
    })
  );

  return plansWithTemplates as ClientPlanWithTemplate[];
}

export async function getClientPlan(id: string) {
  const { data, error } = await supabase
    .from("client_plans")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as ClientPlan;
}

export async function assignTemplateToClient(clientId: string, input: AssignTemplateInput) {
  // Fetch template
  const template = await getTemplate(input.template_id);

  // Merge data if personalizing
  let finalData = template.data;
  if (input.personalize && input.data_override) {
    finalData = { ...template.data, ...input.data_override };
  }

  // Use FSM to assign plan
  const result = await assignPlanToClient(clientId, {
    name: input.name_override || template.name,
    description: input.description || template.description,
    data: finalData,
  });

  // Update the plan to link it to the template
  if (result.plan) {
    const { error: updateError } = await supabase
      .from("client_plans")
      .update({ derived_from_template_id: input.template_id })
      .eq("id", result.plan.id);

    if (updateError) throw updateError;
    
    return { ...result.plan, derived_from_template_id: input.template_id } as ClientPlan;
  }

  throw new Error("Failed to assign plan");
}

/**
 * Creates a plan draft. Does NOT activate the plan.
 * Activation must be performed explicitly via set_active_plan_v2 or FSM assignment.
 * The status "IN_CORSO" is a legacy DB default and must NOT be read as business state.
 */
export async function createClientPlanFromScratch(
  clientId: string,
  input: { name: string; description?: string; objective?: string; data: any }
) {
  const coachClientId = await getCoachClientId(clientId);

  const { data, error } = await supabase
    .from("client_plans")
    .insert({
      coach_client_id: coachClientId,
      name: input.name,
      description: input.description,
      objective: input.objective,
      data: input.data,
      is_visible: true,
      is_in_use: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ClientPlan;
}

export async function updateClientPlan(id: string, updates: Partial<ClientPlan>) {
  const { data, error } = await supabase
    .from("client_plans")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as ClientPlan;
}


export async function saveClientPlanAsTemplate(planId: string, input: SaveAsTemplateInput) {
  const plan = await getClientPlan(planId);
  const { data: coach } = await supabase.auth.getUser();
  if (!coach.user) throw new Error("Not authenticated");

  // Create new template
  const { data: newTemplate, error: templateError } = await supabase
    .from("plan_templates")
    .insert({
      coach_id: coach.user.id,
      created_by_id: coach.user.id,
      name: input.name,
      description: input.description,
      data: plan.data,
    })
    .select()
    .single();

  if (templateError) throw templateError;

  // Optionally assign this new template to the client
  if (input.also_assign) {
    // Get the client_id from the plan's coach_client
    const { data: cc } = await supabase
      .from("coach_clients")
      .select("client_id")
      .eq("id", plan.coach_client_id)
      .single();

    if (cc) {
      // Use FSM to assign plan properly
      await assignPlanToClient(cc.client_id, {
        name: input.name,
        description: input.description,
        data: plan.data,
      });

      // Source of truth: client_plan_assignments
      const { data: activeAssignment } = await supabase
        .from("client_plan_assignments")
        .select("plan_id")
        .eq("client_id", cc.client_id)
        .eq("status", "ACTIVE")
        .maybeSingle();

      if (activeAssignment) {
        await supabase
          .from("client_plans")
          .update({ derived_from_template_id: newTemplate.id })
          .eq("id", activeAssignment.plan_id);
      }
    }
  }

  return newTemplate;
}
