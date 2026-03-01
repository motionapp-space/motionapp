import { supabase } from "@/integrations/supabase/client";

export interface CoachOverview {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  active_clients_count: number;
  total_events_count: number;
  total_plans_count: number;
}

export async function fetchCoachesOverview(): Promise<CoachOverview[]> {
  const { data, error } = await supabase.rpc("admin_get_coaches_overview");

  if (error) {
    console.error("Error fetching coaches overview:", error);
    throw error;
  }

  return (data as CoachOverview[]) ?? [];
}
