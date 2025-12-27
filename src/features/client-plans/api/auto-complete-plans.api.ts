import { supabase } from "@/integrations/supabase/client";
import { getCoachClientId } from "@/lib/coach-client";

/**
 * Auto-completes all other IN_CORSO plans for a client except the specified plan.
 * This enforces the single active plan rule.
 * 
 * @param clientId - The client ID
 * @param excludePlanId - The plan ID to exclude from auto-completion (the one being activated)
 * @returns Number of plans auto-completed
 */
export async function autoCompleteOtherActivePlans(
  clientId: string,
  excludePlanId: string
): Promise<number> {
  const coachClientId = await getCoachClientId(clientId);

  // Find all IN_CORSO plans for this coach-client relationship except the one being activated
  const { data: existingPlans, error: fetchError } = await supabase
    .from("client_plans")
    .select("id")
    .eq("coach_client_id", coachClientId)
    .eq("status", "IN_CORSO")
    .neq("id", excludePlanId);

  if (fetchError) throw fetchError;

  if (!existingPlans || existingPlans.length === 0) {
    return 0;
  }

  const now = new Date().toISOString();
  const planIds = existingPlans.map(p => p.id);

  // Auto-complete all these plans
  const { error: updateError } = await supabase
    .from("client_plans")
    .update({
      status: "COMPLETATO",
      locked_at: now,
      completed_at: now,
    })
    .in("id", planIds);

  if (updateError) throw updateError;

  return planIds.length;
}
