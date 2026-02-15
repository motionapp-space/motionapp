import type { BookingEmailSnapshot } from "./email-snapshots/index.ts";
import type { EmailType } from "./email-outbox.ts";

/**
 * Template data per email di appuntamento.
 * Struttura esplicita e stabile per i template email.
 * Disaccoppiata dallo snapshot interno.
 */
export interface AppointmentEmailTemplateData {
  // Dati appuntamento
  appointment_date: string;
  appointment_end: string;
  appointment_title?: string;
  
  // Partecipanti
  coach_name: string;
  client_name: string;
  
  // Contesto azione (per copy nell'email)
  actor_role: 'coach' | 'client';
  
  // Specifico per cancellazione
  cancelled_by?: 'coach' | 'client';
  
  // Specifico per counter-proposal
  original_date?: string;
  original_end?: string;
  proposed_date?: string;
  proposed_end?: string;
  
  // Note opzionali
  notes?: string;
}

/**
 * Costruisce templateData specifico per il tipo email.
 * 
 * Separa esplicitamente:
 * - snapshot: dati interni immutabili (struttura tecnica)
 * - templateData: payload per il template (struttura presentazione)
 * 
 * Vantaggi:
 * - Template più stabili (non dipendono dalla struttura snapshot)
 * - Snapshot evolvibile senza breaking changes sui template
 * - Meno coupling tra layer
 */
export function buildTemplateData(
  emailType: EmailType,
  snapshot: BookingEmailSnapshot
): Record<string, unknown> {
  // Dati base comuni a tutti i tipi email
  const baseData: Record<string, unknown> = {
    appointment_date: snapshot.start_at,
    appointment_end: snapshot.end_at,
    appointment_title: snapshot.title,
    coach_name: snapshot.coach_name,
    client_name: snapshot.client_name,
    actor_role: snapshot.actor_role,
  };

  // Estensioni specifiche per tipo email
  switch (emailType) {
    case 'appointment_cancelled':
      return {
        ...baseData,
        cancelled_by: snapshot.actor_role,
      };

    case 'appointment_counter_proposed':
      return {
        ...baseData,
        original_date: snapshot.original_start_at,
        original_end: snapshot.original_end_at,
        proposed_date: snapshot.proposed_start_at,
        proposed_end: snapshot.proposed_end_at,
        notes: snapshot.notes,
      };

    case 'appointment_request_created':
      return {
        ...baseData,
        notes: snapshot.notes,
      };

    case 'appointment_accepted':
    case 'appointment_created_by_coach':
    default:
      return baseData;
  }
}
