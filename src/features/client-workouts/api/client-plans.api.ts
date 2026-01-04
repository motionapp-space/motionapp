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

/**
 * Get the active plan for the current client user
 * Uses coach_clients.active_plan_id instead of is_in_use flag
 */
export async function getClientActivePlan(): Promise<ClientActivePlan | null> {
  const { coachClientId } = await getClientCoachClientId();

  // Fetch active_plan_id from coach_clients
  const { data: cc, error: ccError } = await supabase
    .from("coach_clients")
    .select("active_plan_id")
    .eq("id", coachClientId)
    .single();

  if (ccError) throw ccError;
  
  // If no active plan, return null
  if (!cc?.active_plan_id) return null;

  // Fetch the active plan
  const { data, error } = await supabase
    .from("client_plans")
    .select("id, name, data, status, is_in_use")
    .eq("id", cc.active_plan_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  
  if (!data) return null;
  
  return {
    ...data,
    data: data.data as unknown as Plan,
  };
}
