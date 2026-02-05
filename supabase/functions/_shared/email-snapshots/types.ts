import { SupabaseClient } from "npm:@supabase/supabase-js@2";

/**
 * Snapshot immutabile per email booking.
 * Contiene TUTTI i dati necessari per generare l'email.
 * Costruito SOLO server-side con service role.
 */
export interface BookingEmailSnapshot {
  // Identificatori (solo per logging/tracing)
  event_id?: string;
  booking_request_id?: string;
  
  // Dati temporali
  start_at: string;
  end_at: string;
  title?: string;
  
  // Per counter-proposal
  original_start_at?: string;
  original_end_at?: string;
  proposed_start_at?: string;
  proposed_end_at?: string;
  
  notes?: string;
  
  // Coach
  coach_user_id: string;
  coach_name: string;
  coach_email: string;
  
  // Client
  client_user_id?: string;
  client_name: string;
  client_email: string;
  
  // Contesto
  actor_role: 'coach' | 'client';
}

/**
 * Tipo per il Supabase client con service role.
 */
export type SupabaseAdminClient = SupabaseClient;
