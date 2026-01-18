import type { BookingEmailSnapshot, SupabaseAdminClient } from "./types.ts";

/**
 * Costruisce snapshot da una booking request.
 * DEVE essere eseguita server-side con service role.
 * 
 * @param supabaseAdmin - Supabase client con service role
 * @param requestId - ID della booking request
 * @param actorRole - Ruolo dell'attore che ha generato l'azione
 */
export async function buildBookingRequestSnapshot(
  supabaseAdmin: SupabaseAdminClient,
  requestId: string,
  actorRole: 'coach' | 'client'
): Promise<BookingEmailSnapshot> {
  console.log(`[buildBookingRequestSnapshot] Building snapshot for request ${requestId}, actor: ${actorRole}`);

  // Fetch request con join su coach_clients e clients
  const { data: request, error: requestError } = await supabaseAdmin
    .from('booking_requests')
    .select(`
      id, requested_start_at, requested_end_at, notes,
      counter_proposal_start_at, counter_proposal_end_at,
      finalized_start_at, finalized_end_at,
      coach_clients!inner(
        coach_id,
        clients!inner(first_name, last_name, email, user_id)
      )
    `)
    .eq('id', requestId)
    .single();

  if (requestError || !request) {
    console.error(`[buildBookingRequestSnapshot] Booking request not found: ${requestId}`, requestError);
    throw new Error(`Booking request not found: ${requestId}`);
  }

  // Type assertion for the joined data
  const coachClients = request.coach_clients as unknown as {
    coach_id: string;
    clients: {
      first_name: string;
      last_name: string;
      email: string | null;
      user_id: string | null;
    };
  };

  const coachId = coachClients.coach_id;
  const client = coachClients.clients;

  // Fetch coach data dalla tabella users (service role bypassa RLS)
  const { data: coach, error: coachError } = await supabaseAdmin
    .from('users')
    .select('first_name, last_name, email')
    .eq('id', coachId)
    .single();

  if (coachError || !coach?.email) {
    console.error(`[buildBookingRequestSnapshot] Coach not found for request: ${requestId}`, coachError);
    throw new Error(`Coach not found for request: ${requestId}`);
  }

  const snapshot: BookingEmailSnapshot = {
    booking_request_id: request.id,
    start_at: request.finalized_start_at || request.requested_start_at,
    end_at: request.finalized_end_at || request.requested_end_at,
    original_start_at: request.requested_start_at,
    original_end_at: request.requested_end_at,
    proposed_start_at: request.counter_proposal_start_at ?? undefined,
    proposed_end_at: request.counter_proposal_end_at ?? undefined,
    notes: request.notes ?? undefined,
    coach_user_id: coachId,
    coach_name: `${coach.first_name || ''} ${coach.last_name || ''}`.trim() || 'Coach',
    coach_email: coach.email,
    client_user_id: client.user_id ?? undefined,
    client_name: `${client.first_name} ${client.last_name}`,
    client_email: client.email || '',
    actor_role: actorRole,
  };

  console.log(`[buildBookingRequestSnapshot] Snapshot built successfully for request ${requestId}`);
  return snapshot;
}
