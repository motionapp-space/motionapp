import { supabase } from "@/integrations/supabase/client";
import type { CoachSettings, UpdateCoachSettingsInput } from "../types";

/**
 * Get or create coach settings for the authenticated coach
 */
export async function getCoachSettings(): Promise<CoachSettings> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  let { data, error } = await supabase
    .from("coach_settings")
    .select("*")
    .eq("coach_id", session.session.user.id)
    .maybeSingle();

  // Create default settings if they don't exist
  if (!data && !error) {
    const { data: newSettings, error: insertError } = await supabase
      .from("coach_settings")
      .insert({
        coach_id: session.session.user.id,
        lock_window_hours: 24,
        currency_code: 'EUR',
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return newSettings;
  }

  if (error) throw error;
  return data!;
}

/**
 * Update coach settings
 */
export async function updateCoachSettings(
  settings: UpdateCoachSettingsInput
): Promise<CoachSettings> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Non autenticato");

  const { data, error } = await supabase
    .from("coach_settings")
    .update(settings)
    .eq("coach_id", session.session.user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
