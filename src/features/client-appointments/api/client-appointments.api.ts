import { supabase } from "@/integrations/supabase/client";
import type { Event } from "@/features/events/types";

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

/**
 * Recupera gli appuntamenti FUTURI per un determinato client
 */
export async function getClientAppointments(clientId: string): Promise<ClientAppointment[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("events")
    .select("id,title,start_at,end_at,session_status,source,is_all_day,location")
    .eq("client_id", clientId)
    .gte("start_at", now)
    .order("start_at", { ascending: true });

  if (error) {
    console.error("Error fetching client appointments", error);
    throw error;
  }

  return (data as ClientAppointment[]) || [];
}
