import { supabase } from "@/integrations/supabase/client";
import type { ClientPlan, ClientPlanWithTemplate, AssignTemplateInput, SaveAsTemplateInput } from "@/types/template";
import { getTemplate } from "@/features/templates/api/templates.api";

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
  const { data: coach } = await supabase.auth.getUser();
  if (!coach.user) throw new Error("Not authenticated");

  // Fetch template
  const template = await getTemplate(input.template_id);

  // Merge data if personalizing
  let finalData = template.data;
  if (input.personalize && input.data_override) {
    finalData = { ...template.data, ...input.data_override };
  }

  const { data, error } = await supabase
    .from("client_plans")
    .insert({
      client_id: clientId,
      coach_id: coach.user.id,
      name: input.name_override || template.name,
      description: input.description || template.description,
      data: finalData,
      status: 'ACTIVE',
      derived_from_template_id: input.template_id,
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

export async function updateClientPlanStatus(id: string, status: ClientPlan['status']) {
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
    const { error: assignError } = await supabase
      .from("client_plans")
      .insert({
        client_id: plan.client_id,
        coach_id: coach.user.id,
        name: input.name,
        description: input.description,
        data: plan.data,
        status: 'ACTIVE',
        derived_from_template_id: newTemplate.id,
      });

    if (assignError) throw assignError;
  }

  return newTemplate;
}
