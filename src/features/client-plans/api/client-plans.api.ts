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

export async function updateClientPlan(id: string, updates: Partial<ClientPlan>) {
  // Get the plan and client info first
  const { data: plan, error: planError } = await supabase
    .from("client_plans")
    .select("client_id, status")
    .eq("id", id)
    .single();

  if (planError) throw planError;

  let autoCompletedCount = 0;
  
  // If status is being changed to IN_CORSO, auto-complete other active plans
  if (updates.status === "IN_CORSO") {
    const { autoCompleteOtherActivePlans } = await import("./auto-complete-plans.api");
    autoCompletedCount = await autoCompleteOtherActivePlans(plan.client_id, id);
  }

  // Update the plan
  const { data, error } = await supabase
    .from("client_plans")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // If the plan was IN_CORSO and is now COMPLETATO or ELIMINATO, check client status
  if (plan.status === "IN_CORSO" && (updates.status === "COMPLETATO" || updates.status === "ELIMINATO")) {
    // Check if this was the active plan for the client
    const { data: client } = await supabase
      .from("clients")
      .select("id, status, active_plan_id")
      .eq("id", plan.client_id)
      .single();

    if (client && client.active_plan_id === id && client.status === "ATTIVO") {
      // Check if there are any other IN_CORSO plans for this client
      const { data: otherActivePlans } = await supabase
        .from("client_plans")
        .select("id")
        .eq("client_id", plan.client_id)
        .eq("status", "IN_CORSO")
        .neq("id", id);

      // If no other IN_CORSO plans, transition client to POTENZIALE
      if (!otherActivePlans || otherActivePlans.length === 0) {
        await supabase
          .from("clients")
          .update({
            status: "POTENZIALE",
            active_plan_id: null,
          })
          .eq("id", plan.client_id);
      }
    }
  }
  
  return { 
    ...data as ClientPlan, 
    _autoCompletedCount: autoCompletedCount 
  };
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
