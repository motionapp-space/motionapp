import { supabase } from "@/integrations/supabase/client";
import type {
  OutOfOfficeBlock,
  CreateOutOfOfficeBlockInput,
  UpdateOutOfOfficeBlockInput,
} from "../types";

export async function listOutOfOfficeBlocks(): Promise<OutOfOfficeBlock[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("out_of_office_blocks")
    .select("*")
    .eq("coach_id", user.id)
    .order("start_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getOutOfOfficeBlockById(id: string): Promise<OutOfOfficeBlock> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("out_of_office_blocks")
    .select("*")
    .eq("id", id)
    .eq("coach_id", user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function createOutOfOfficeBlock(
  input: CreateOutOfOfficeBlockInput
): Promise<OutOfOfficeBlock> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("out_of_office_blocks")
    .insert({
      coach_id: user.id,
      is_recurring: false,
      ...input,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateOutOfOfficeBlock(
  id: string,
  input: UpdateOutOfOfficeBlockInput
): Promise<OutOfOfficeBlock> {
  const { data, error } = await supabase
    .from("out_of_office_blocks")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteOutOfOfficeBlock(id: string): Promise<void> {
  const { error } = await supabase
    .from("out_of_office_blocks")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
