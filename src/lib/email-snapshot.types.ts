/**
 * Snapshot contract per email booking.
 * Contiene TUTTI i dati necessari per generare l'email.
 * NON richiede query aggiuntive - immutabile al momento dell'azione.
 */
export interface BookingEmailSnapshot {
  // Identificatori (solo per reference/logging, non per lookup)
  event_id?: string;
  booking_request_id?: string;
  
  // Dati temporali appuntamento
  start_at: string;
  end_at: string;
  title?: string;
  
  // Per counter-proposal
  original_start_at?: string;
  original_end_at?: string;
  proposed_start_at?: string;
  proposed_end_at?: string;
  
  notes?: string;
  
  // Coach (sempre presente)
  coach_user_id: string;
  coach_name: string;
  coach_email: string;
  
  // Client (sempre presente)
  client_user_id?: string;
  client_name: string;
  client_email: string;
  
  // Contesto - chi sta eseguendo l'azione
  actor_role: 'coach' | 'client';
}

export type BookingEmailType =
  | 'appointment_request_created'
  | 'appointment_accepted'
  | 'appointment_counter_proposed'
  | 'appointment_cancelled';
