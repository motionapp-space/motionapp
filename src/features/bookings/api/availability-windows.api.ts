import { supabase } from "@/integrations/supabase/client";
import type { AvailabilityWindow, CreateAvailabilityWindowInput } from "../types";

export async function listAvailabilityWindows(): Promise<AvailabilityWindow[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("availability_windows")
    .select("*")
    .eq("coach_id", user.id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createAvailabilityWindow(
  input: CreateAvailabilityWindowInput
): Promise<AvailabilityWindow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("availability_windows")
    .insert({
      coach_id: user.id,
      ...input,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAvailabilityWindow(id: string): Promise<void> {
  const { error } = await supabase
    .from("availability_windows")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function batchCreateAvailabilityWindows(
  windows: CreateAvailabilityWindowInput[]
): Promise<AvailabilityWindow[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("availability_windows")
    .insert(
      windows.map(w => ({
        coach_id: user.id,
        ...w,
      }))
    )
    .select();

  if (error) throw error;
  return data;
}

export async function replaceAvailabilityWindows(
  windows: CreateAvailabilityWindowInput[]
): Promise<AvailabilityWindow[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Delete all existing windows
  await supabase
    .from("availability_windows")
    .delete()
    .eq("coach_id", user.id);

  // Insert new windows
  return batchCreateAvailabilityWindows(windows);
}
