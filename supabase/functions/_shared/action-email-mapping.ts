import type { EmailType } from "./email-outbox.ts";

/**
 * Azioni client supportate.
 * Rappresentano l'INTENTO dell'utente, non il tipo email.
 */
export type ClientActionType =
  | 'cancel_appointment'
  | 'cancel_booking_request'
  | 'create_booking_request'
  | 'reject_change_proposal'
  | 'reject_counter_proposal'
  | 'accept_counter_proposal';

/**
 * Azioni coach supportate.
 */
export type CoachActionType =
  | 'cancel_appointment'
  | 'approve_booking_request'
  | 'decline_booking_request'
  | 'counter_propose_booking_request';

/**
 * Tutte le azioni.
 */
export type ActionType = ClientActionType | CoachActionType;

/**
 * Configurazione di dispatch email.
 * Separa esplicitamente:
 * - emailType: quale template usare
 * - recipientRole: chi riceve l'email (indipendente da chi ha agito)
 */
export interface EmailDispatchConfig {
  emailType: EmailType;
  recipientRole: 'coach' | 'client';
}

/**
 * Mappa esplicita: action → configurazione email
 * 
 * recipientRole indica CHI RICEVE l'email, non chi ha agito.
 * actor_role nello snapshot indica chi ha compiuto l'azione (per contesto/copy).
 * 
 * null indica che l'azione non genera email.
 */
export const ACTION_TO_EMAIL: Record<ActionType, EmailDispatchConfig | null> = {
  // Client actions → notificano il COACH
  'cancel_appointment': { emailType: 'appointment_cancelled', recipientRole: 'coach' },
  'cancel_booking_request': { emailType: 'appointment_cancelled', recipientRole: 'coach' },
  'create_booking_request': { emailType: 'appointment_request_created', recipientRole: 'coach' },
  'reject_change_proposal': { emailType: 'appointment_cancelled', recipientRole: 'coach' },
  'reject_counter_proposal': { emailType: 'appointment_cancelled', recipientRole: 'coach' },
  'accept_counter_proposal': { emailType: 'appointment_accepted', recipientRole: 'coach' },
  
  // Coach actions → notificano il CLIENT
  'approve_booking_request': { emailType: 'appointment_accepted', recipientRole: 'client' },
  'decline_booking_request': { emailType: 'appointment_cancelled', recipientRole: 'client' },
  'counter_propose_booking_request': { emailType: 'appointment_counter_proposed', recipientRole: 'client' },
};

/**
 * Ottiene la configurazione di dispatch per un'azione.
 * Ritorna null se l'azione non genera email.
 */
export function getEmailDispatchConfig(action: ActionType): EmailDispatchConfig | null {
  return ACTION_TO_EMAIL[action] ?? null;
}

/**
 * @deprecated Usare getEmailDispatchConfig per ottenere sia emailType che recipientRole
 */
export function getEmailTypeForAction(action: ActionType): EmailType | null {
  const config = ACTION_TO_EMAIL[action];
  return config?.emailType ?? null;
}
