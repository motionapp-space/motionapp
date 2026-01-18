import type { BookingEmailSnapshot, SupabaseAdminClient } from "./types.ts";

/**
 * Costruisce snapshot da un evento.
 * DEVE essere eseguita server-side con service role.
 * 
 * @param supabaseAdmin - Supabase client con service role
 * @param eventId - ID dell'evento
 * @param actorRole - Ruolo dell'attore che ha generato l'azione
 */
export async function buildEventSnapshot(
  supabaseAdmin: SupabaseAdminClient,
  eventId: string,
  actorRole: 'coach' | 'client'
): Promise<BookingEmailSnapshot> {
  console.log(`[buildEventSnapshot] Building snapshot for event ${eventId}, actor: ${actorRole}`);

  // Fetch event con join su coach_clients e clients
  const { data: event, error: eventError } = await supabaseAdmin
    .from('events')
    .select(`
      id, title, start_at, end_at,
      coach_clients!inner(
        coach_id,
        clients!inner(first_name, last_name, email, user_id)
      )
    `)
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    console.error(`[buildEventSnapshot] Event not found: ${eventId}`, eventError);
    throw new Error(`Event not found: ${eventId}`);
  }

  // Type assertion for the joined data
  const coachClients = event.coach_clients as unknown as {
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
    console.error(`[buildEventSnapshot] Coach not found for event: ${eventId}`, coachError);
    throw new Error(`Coach not found for event: ${eventId}`);
  }

  const snapshot: BookingEmailSnapshot = {
    event_id: event.id,
    title: event.title ?? undefined,
    start_at: event.start_at,
    end_at: event.end_at,
    coach_user_id: coachId,
    coach_name: `${coach.first_name || ''} ${coach.last_name || ''}`.trim() || 'Coach',
    coach_email: coach.email,
    client_user_id: client.user_id ?? undefined,
    client_name: `${client.first_name} ${client.last_name}`,
    client_email: client.email || '',
    actor_role: actorRole,
  };

  console.log(`[buildEventSnapshot] Snapshot built successfully for event ${eventId}`);
  return snapshot;
}
