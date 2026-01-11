import { supabase } from "@/integrations/supabase/client";

export interface CreateInviteResult {
  success: boolean;
  inviteLink?: string;
  expiresAt?: string;
  clientName?: string;
  email?: string;
  emailSent?: boolean;
  emailError?: string | null;
  error?: string;
}

export interface ClientInvite {
  id: string;
  coach_id: string;
  client_id: string;
  email: string;
  token: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}

/**
 * Create an invite for a client
 * Requires coach authentication
 */
export async function createInvite(clientId: string): Promise<CreateInviteResult> {
  const { data, error } = await supabase.functions.invoke("create-invite", {
    body: { clientId },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data;
}

/**
 * Get the latest invite for a client
 */
export async function getClientInvite(clientId: string): Promise<ClientInvite | null> {
  const { data, error } = await supabase
    .from("client_invites")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching client invite:", error);
    return null;
  }

  return data as ClientInvite | null;
}

/**
 * Regenerate an invite for a client (revokes old one and creates new)
 */
export async function regenerateInvite(clientId: string): Promise<CreateInviteResult> {
  return createInvite(clientId);
}
