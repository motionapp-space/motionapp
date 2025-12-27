import { supabase } from "@/integrations/supabase/client";
import { getClientCoachClientId } from "@/lib/coach-client";
import type { Plan } from "@/types/plan";

export interface ClientActivePlan {
  id: string;
  name: string;
  data: Plan;
  status: string;
  is_in_use: boolean;
}

export async function getClientActivePlan(): Promise<ClientActivePlan | null> {
  const { coachClientId } = await getClientCoachClientId();

  const { data, error } = await supabase
    .from("client_plans")
    .select("id, name, data, status, is_in_use")
    .eq("coach_client_id", coachClientId)
    .eq("is_in_use", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  
  if (!data) return null;
  
  return {
    ...data,
    data: data.data as unknown as Plan,
  };
}
