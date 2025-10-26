import { supabase } from "@/integrations/supabase/client";
import type { BookingSettings, UpdateBookingSettingsInput } from "../types";

export async function getBookingSettings(): Promise<BookingSettings | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("booking_settings")
    .select("*")
    .eq("coach_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createBookingSettings(
  input: UpdateBookingSettingsInput
): Promise<BookingSettings> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("booking_settings")
    .insert({
      coach_id: user.id,
      ...input,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBookingSettings(
  id: string,
  input: UpdateBookingSettingsInput
): Promise<BookingSettings> {
  const { data, error } = await supabase
    .from("booking_settings")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function upsertBookingSettings(
  input: UpdateBookingSettingsInput
): Promise<BookingSettings> {
  const existing = await getBookingSettings();
  
  if (existing) {
    return updateBookingSettings(existing.id, input);
  } else {
    return createBookingSettings(input);
  }
}
