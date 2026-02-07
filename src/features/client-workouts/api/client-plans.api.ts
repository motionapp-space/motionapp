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
 * Get the active plan for the current client user.
 * Source of truth: client_plan_assignments.status = 'ACTIVE'
 */
export async function getClientActivePlan(): Promise<ClientActivePlan | null> {
  const { clientId } = await getClientCoachClientId();

  // Source of truth: client_plan_assignments
  const { data: assignment, error: assignError } = await supabase
    .from("client_plan_assignments")
    .select("plan_id")
    .eq("client_id", clientId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (assignError) throw assignError;
  if (!assignment) return null;

  // Fetch the active plan
  const { data, error } = await supabase
    .from("client_plans")
    .select("id, name, data, status, is_in_use")
    .eq("id", assignment.plan_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    data: data.data as unknown as Plan,
  };
}
