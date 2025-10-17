import { supabase } from "@/integrations/supabase/client";
import type { PlanTemplate, CreateTemplateInput, UpdateTemplateInput } from "@/types/template";

export async function getTemplates(filters?: {
  q?: string;
  category?: string;
  tag?: string;
  sort?: string;
}) {
  let query = supabase
    .from("plan_templates")
    .select("*")
    .order("updated_at", { ascending: false });

  if (filters?.q) {
    query = query.ilike("name", `%${filters.q}%`);
  }

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  // Add tag filtering if needed (requires join)

  const { data, error } = await query;
  if (error) throw error;
  return data as PlanTemplate[];
}

export async function getTemplate(id: string) {
  const { data, error } = await supabase
    .from("plan_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as PlanTemplate;
}

export async function createTemplate(input: CreateTemplateInput) {
  const { data: coach } = await supabase.auth.getUser();
  if (!coach.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("plan_templates")
    .insert({
      coach_id: coach.user.id,
      created_by_id: coach.user.id,
      name: input.name,
      description: input.description,
      data: input.data,
      category: input.category,
    })
    .select()
    .single();

  if (error) throw error;
  return data as PlanTemplate;
}

export async function updateTemplate(id: string, input: UpdateTemplateInput) {
  const { data, error } = await supabase
    .from("plan_templates")
    .update({
      name: input.name,
      description: input.description,
      data: input.data,
      category: input.category,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as PlanTemplate;
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase
    .from("plan_templates")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function duplicateTemplate(id: string) {
  const original = await getTemplate(id);
  const { data: coach } = await supabase.auth.getUser();
  if (!coach.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("plan_templates")
    .insert({
      coach_id: coach.user.id,
      created_by_id: coach.user.id,
      name: `${original.name} (copia)`,
      description: original.description,
      data: original.data,
      category: original.category,
    })
    .select()
    .single();

  if (error) throw error;
  return data as PlanTemplate;
}
