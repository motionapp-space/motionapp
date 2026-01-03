/**
 * Deriva lo stato badge per un evento del calendario.
 * 
 * REGOLE DI PRIORITÀ:
 * 1. CANCELED - session_status === 'canceled'
 * 2. PROPOSAL_PENDING - proposal_status === 'pending' (proposta di spostamento attiva)
 * 3. COMPLETED - end_at < now (evento nel passato, non annullato)
 * 4. CONFIRMED - default per tutti gli altri casi
 * 
 * NOTE BETA:
 * - NON usare event.source per dedurre stati
 * - NON usare bookingSettings.approval_mode
 * - "Da confermare" appartiene SOLO alle booking_requests, non agli eventi
 */

export type EventBadge = "CANCELED" | "PROPOSAL_PENDING" | "COMPLETED" | "CONFIRMED";

export interface EventBadgeInput {
  session_status?: string | null;
  proposal_status?: string | null;
  end_at: string;
}

export function deriveEventBadge(
  event: EventBadgeInput,
  now: Date = new Date()
): EventBadge {
  // 1. CANCELED ha priorità assoluta (anche su eventi passati)
  if (event.session_status === 'canceled') {
    return "CANCELED";
  }

  // 2. PROPOSAL_PENDING - proposta di spostamento attiva
  if (event.proposal_status === 'pending') {
    return "PROPOSAL_PENDING";
  }

  // 3. COMPLETED - evento nel passato
  const eventEnd = new Date(event.end_at);
  if (eventEnd < now) {
    return "COMPLETED";
  }

  // 4. CONFIRMED - default per scheduled, no_show, done, o qualsiasi altro stato
  return "CONFIRMED";
}
