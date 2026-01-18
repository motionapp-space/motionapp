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
 * Mappa esplicita: action → email_type
 * 
 * Alcune azioni possono generare lo stesso tipo email
 * (es. cancel_appointment e reject_change_proposal → appointment_cancelled)
 * 
 * null indica che l'azione non genera email.
 */
export const ACTION_TO_EMAIL_TYPE: Record<ActionType, EmailType | null> = {
  // Client actions
  'cancel_appointment': 'appointment_cancelled',
  'cancel_booking_request': 'appointment_cancelled',
  'create_booking_request': 'appointment_request_created',
  'reject_change_proposal': 'appointment_cancelled',
  'reject_counter_proposal': 'appointment_cancelled',
  'accept_counter_proposal': 'appointment_accepted',
  
  // Coach actions
  'approve_booking_request': 'appointment_accepted',
  'decline_booking_request': 'appointment_cancelled',
  'counter_propose_booking_request': 'appointment_counter_proposed',
};

/**
 * Risolve il tipo email per un'azione.
 * Ritorna null se l'azione non genera email.
 */
export function getEmailTypeForAction(action: ActionType): EmailType | null {
  return ACTION_TO_EMAIL_TYPE[action] ?? null;
}
