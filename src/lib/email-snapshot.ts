import { supabase } from "@/integrations/supabase/client";
import type { BookingEmailSnapshot } from "./email-snapshot.types";

/**
 * Costruisce snapshot da un evento esistente.
 * DEVE essere chiamata PRIMA di qualsiasi operazione distruttiva (delete/cancel).
 */
export async function buildEventSnapshot(
  event: {
    id: string;
    title?: string | null;
    start_at: string;
    end_at: string;
    coach_client_id: string;
  },
  actorRole: 'coach' | 'client'
): Promise<BookingEmailSnapshot> {
  // Fetch coach_clients + clients in una query
  const { data: cc, error: ccError } = await supabase
    .from("coach_clients")
    .select(`
      coach_id,
      clients!inner(first_name, last_name, email, user_id)
    `)
    .eq("id", event.coach_client_id)
    .single();

  if (ccError || !cc) {
    throw new Error("Coach-client relationship not found for snapshot");
  }

  const client = cc.clients as unknown as {
    first_name: string;
    last_name: string;
    email: string | null;
    user_id: string | null;
  };

  // Fetch coach info from users table
  const { data: coach, error: coachError } = await supabase
    .from("users")
    .select("first_name, last_name, email")
    .eq("id", cc.coach_id)
    .single();

  if (coachError || !coach?.email) {
    throw new Error("Coach not found for snapshot");
  }

  return {
    event_id: event.id,
    title: event.title ?? undefined,
    start_at: event.start_at,
    end_at: event.end_at,
    coach_user_id: cc.coach_id,
    coach_name: `${coach.first_name || ''} ${coach.last_name || ''}`.trim() || 'Coach',
    coach_email: coach.email,
    client_user_id: client.user_id ?? undefined,
    client_name: `${client.first_name} ${client.last_name}`,
    client_email: client.email || '',
    actor_role: actorRole,
  };
}

/**
 * Costruisce snapshot da una booking request esistente.
 * DEVE essere chiamata PRIMA di qualsiasi operazione distruttiva (approve/decline/cancel).
 */
export async function buildBookingRequestSnapshot(
  request: {
    id: string;
    requested_start_at: string;
    requested_end_at: string;
    counter_proposal_start_at?: string | null;
    counter_proposal_end_at?: string | null;
    finalized_start_at?: string | null;
    finalized_end_at?: string | null;
    notes?: string | null;
    coach_client_id: string;
  },
  actorRole: 'coach' | 'client'
): Promise<BookingEmailSnapshot> {
  // Fetch coach_clients + clients in una query
  const { data: cc, error: ccError } = await supabase
    .from("coach_clients")
    .select(`
      coach_id,
      clients!inner(first_name, last_name, email, user_id)
    `)
    .eq("id", request.coach_client_id)
    .single();

  if (ccError || !cc) {
    throw new Error("Coach-client relationship not found for snapshot");
  }

  const client = cc.clients as unknown as {
    first_name: string;
    last_name: string;
    email: string | null;
    user_id: string | null;
  };

  // Fetch coach info from users table
  const { data: coach, error: coachError } = await supabase
    .from("users")
    .select("first_name, last_name, email")
    .eq("id", cc.coach_id)
    .single();

  if (coachError || !coach?.email) {
    throw new Error("Coach not found for snapshot");
  }

  return {
    booking_request_id: request.id,
    start_at: request.finalized_start_at || request.requested_start_at,
    end_at: request.finalized_end_at || request.requested_end_at,
    original_start_at: request.requested_start_at,
    original_end_at: request.requested_end_at,
    proposed_start_at: request.counter_proposal_start_at ?? undefined,
    proposed_end_at: request.counter_proposal_end_at ?? undefined,
    notes: request.notes ?? undefined,
    coach_user_id: cc.coach_id,
    coach_name: `${coach.first_name || ''} ${coach.last_name || ''}`.trim() || 'Coach',
    coach_email: coach.email,
    client_user_id: client.user_id ?? undefined,
    client_name: `${client.first_name} ${client.last_name}`,
    client_email: client.email || '',
    actor_role: actorRole,
  };
}

/**
 * Helper per accodare email con snapshot completo.
 * Centralizza la chiamata alla edge function.
 */
export async function queueBookingEmailWithSnapshot(params: {
  type: 'appointment_request_created' | 'appointment_accepted' | 'appointment_counter_proposed' | 'appointment_cancelled' | 'appointment_created_by_coach';
  actorUserId: string;
  snapshot: BookingEmailSnapshot;
}): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('queue-booking-email', {
      body: params
    });
    if (error) {
      console.warn('[queueBookingEmailWithSnapshot] Failed to queue email:', error);
    }
  } catch (e) {
    console.warn('[queueBookingEmailWithSnapshot] Failed to queue email:', e);
  }
}
