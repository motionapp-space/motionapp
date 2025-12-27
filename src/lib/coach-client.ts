import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to get the coach_client_id for a given client
 * This is used after the DB refactoring where we normalized the schema
 */
export async function getCoachClientId(clientId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("coach_clients")
    .select("id")
    .eq("coach_id", user.id)
    .eq("client_id", clientId)
    .single();

  if (error || !data) {
    throw new Error("Coach-client relationship not found");
  }

  return data.id;
}

/**
 * Get or create coach_client relationship
 */
export async function getOrCreateCoachClientId(clientId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Try to get existing
  const { data: existing } = await supabase
    .from("coach_clients")
    .select("id")
    .eq("coach_id", user.id)
    .eq("client_id", clientId)
    .maybeSingle();

  if (existing) return existing.id;

  // Create new
  const { data: created, error } = await supabase
    .from("coach_clients")
    .insert({
      coach_id: user.id,
      client_id: clientId,
      status: "active",
      role: "primary",
    })
    .select("id")
    .single();

  if (error) throw error;
  return created.id;
}

/**
 * Get client_id and coach_id from a coach_client_id
 */
export async function getCoachClientDetails(coachClientId: string): Promise<{
  coach_id: string;
  client_id: string;
  status: string;
}> {
  const { data, error } = await supabase
    .from("coach_clients")
    .select("coach_id, client_id, status")
    .eq("id", coachClientId)
    .single();

  if (error || !data) {
    throw new Error("Coach-client relationship not found");
  }

  return data;
}

/**
 * Get coach_client_id for client user (from auth_user_id)
 */
export async function getClientCoachClientId(): Promise<{
  coachClientId: string;
  clientId: string;
  coachId: string;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get the client record for this auth user
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, coach_id")
    .eq("auth_user_id", user.id)
    .single();

  if (clientError || !client) {
    throw new Error("Client profile not found");
  }

  // Get the coach_clients relationship
  const { data: cc, error: ccError } = await supabase
    .from("coach_clients")
    .select("id")
    .eq("coach_id", client.coach_id)
    .eq("client_id", client.id)
    .single();

  if (ccError || !cc) {
    throw new Error("Coach-client relationship not found");
  }

  return {
    coachClientId: cc.id,
    clientId: client.id,
    coachId: client.coach_id,
  };
}
