import { supabase } from "@/integrations/supabase/client";

export interface CoachInvite {
  id: string;
  code: string;
  email: string | null;
  max_uses: number;
  used_count: number;
  expires_at: string;
  created_by: string | null;
  created_at: string;
}

export interface CreateInviteData {
  code: string;
  email?: string | null;
  max_uses?: number;
  expires_at: string;
}

/**
 * Fetch all coach invites (admin only via RLS)
 */
export async function fetchCoachInvites(): Promise<CoachInvite[]> {
  const { data, error } = await supabase
    .from("coach_invites")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[coachInvites.api] Error fetching invites:", error);
    throw new Error("Errore nel caricamento degli inviti");
  }

  return data ?? [];
}

/**
 * Create a new coach invite (admin only via RLS)
 */
export async function createCoachInvite(invite: CreateInviteData): Promise<CoachInvite> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Devi essere autenticato per creare un invito");
  }

  const { data, error } = await supabase
    .from("coach_invites")
    .insert({
      code: invite.code,
      email: invite.email ?? null,
      max_uses: invite.max_uses ?? 1,
      expires_at: invite.expires_at,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("[coachInvites.api] Error creating invite:", error);
    if (error.code === "23505") {
      throw new Error("Questo codice esiste già. Riprova.");
    }
    throw new Error("Errore nella creazione dell'invito");
  }

  return data;
}

/**
 * Get invite status based on dates and usage
 */
export function getInviteStatus(invite: CoachInvite): "valid" | "expired" | "used" {
  const now = new Date();
  const expiresAt = new Date(invite.expires_at);

  if (invite.used_count >= invite.max_uses) {
    return "used";
  }
  if (expiresAt <= now) {
    return "expired";
  }
  return "valid";
}
