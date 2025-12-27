import { supabase } from "@/integrations/supabase/client";
import type { Event } from "@/features/events/types";
import { getCoachClientId } from "@/lib/coach-client";

export interface ClientAppointment {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  session_status?: Event["session_status"];
  source?: Event["source"];
  is_all_day?: boolean | null;
  location?: string | null;
}

export interface ClientAppointmentsResult {
  future: ClientAppointment[];
  past: ClientAppointment[];
}

/**
 * Recupera gli appuntamenti FUTURI per un determinato client
 */
async function getFutureAppointments(clientId: string): Promise<ClientAppointment[]> {
  const now = new Date().toISOString();
  
  // Get coach_client_id
  const coachClientId = await getCoachClientId(clientId);

  const { data, error } = await supabase
    .from("events")
    .select("id,title,start_at,end_at,session_status,source,is_all_day,location")
    .eq("coach_client_id", coachClientId)
    .gte("start_at", now)
    .order("start_at", { ascending: true });

  if (error) {
    console.error("Error fetching future appointments", error);
    throw error;
  }

  return (data as ClientAppointment[]) || [];
}

/**
 * Recupera gli appuntamenti PASSATI (storico recente, max 20)
 */
async function getPastAppointments(clientId: string): Promise<ClientAppointment[]> {
  const now = new Date().toISOString();

  // Get coach_client_id
  const coachClientId = await getCoachClientId(clientId);

  const { data, error } = await supabase
    .from("events")
    .select("id,title,start_at,end_at,session_status,source,is_all_day,location")
    .eq("coach_client_id", coachClientId)
    .lt("start_at", now)
    .order("start_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching past appointments", error);
    throw error;
  }

  return (data as ClientAppointment[]) || [];
}

/**
 * Recupera sia gli appuntamenti futuri che passati per un cliente
 */
export async function getClientAppointments(clientId: string): Promise<ClientAppointmentsResult> {
  const [future, past] = await Promise.all([
    getFutureAppointments(clientId),
    getPastAppointments(clientId),
  ]);

  return { future, past };
}
