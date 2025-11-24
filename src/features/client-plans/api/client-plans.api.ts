import { supabase } from "@/integrations/supabase/client";
import type { ClientPlanWithTemplate, AssignTemplateInput, SaveAsTemplateInput } from "@/types/template";
import type { ClientPlan } from "@/features/client-plans/types";
import { getTemplate } from "@/features/templates/api/templates.api";
import { assignPlanToClient } from "@/features/clients/api/client-fsm.api";

export async function getClientPlans(clientId: string) {
  const { data, error } = await supabase
    .from("client_plans")
    .select("*")
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  // Fetch templates for plans with derived_from_template_id
  const plansWithTemplates = await Promise.all(
    (data as ClientPlan[]).map(async (plan) => {
      if (plan.derived_from_template_id) {
        try {
          const template = await getTemplate(plan.derived_from_template_id);
          return { ...plan, template };
        } catch {
          return plan;
        }
      }
      return plan;
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

  // Use FSM to assign plan - this will:
  // 1. Set client status to ATTIVO
  // 2. Set active_plan_id
  // 3. Create plan with IN_CORSO status
  // 4. Handle one-active-plan invariant
  // 5. Log all transitions
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

export async function createClientPlanFromScratch(
  clientId: string,
  input: { name: string; description?: string; data: any }
) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("client_plans")
    .insert({
      client_id: clientId,
      coach_id: auth.user.id,
      name: input.name,
      description: input.description,
      data: input.data,
      status: "IN_CORSO",
      is_visible: true,
      is_in_use: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ClientPlan;
}

export async function updateClientPlan(id: string, updates: Partial<ClientPlan>) {
  // Simple update without auto-completion logic
  const { data, error } = await supabase
    .from("client_plans")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as ClientPlan;
}

export async function updateClientPlanStatus(id: string, status: 'IN_CORSO' | 'COMPLETATO' | 'ELIMINATO') {
  return updateClientPlan(id, { status });
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
    // Use FSM to assign plan properly
    await assignPlanToClient(plan.client_id, {
      name: input.name,
      description: input.description,
      data: plan.data,
    });

    // Update the newly created plan to link it to the template
    const { data: clientPlan } = await supabase
      .from("client_plans")
      .select("*")
      .eq("client_id", plan.client_id)
      .eq("status", "IN_CORSO")
      .single();

    if (clientPlan) {
      await supabase
        .from("client_plans")
        .update({ derived_from_template_id: newTemplate.id })
        .eq("id", clientPlan.id);
    }
  }

  return newTemplate;
}
