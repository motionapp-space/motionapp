import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getClientPlan } from "../api/client-plans.api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Duplicates a plan as a draft. Does NOT activate the duplicated plan.
 * Activation must be performed explicitly via set_active_plan_v2 or FSM assignment.
 * The status "IN_CORSO" is a legacy DB default and must NOT be read as business state.
 */
export function useDuplicatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, clientId }: { planId: string; clientId: string }) => {
      const original = await getClientPlan(planId);
      
      const { data, error } = await supabase
        .from("client_plans")
        .insert({
          coach_client_id: original.coach_client_id,
          name: `${original.name} (Copia)`,
          description: original.description,
          data: original.data,
          derived_from_template_id: original.derived_from_template_id,
          status: "IN_CORSO",
          is_in_use: false,
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, clientId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clientPlans", data.clientId] });
      toast.success("Piano duplicato");
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile duplicare il piano",
      });
    },
  });
}
