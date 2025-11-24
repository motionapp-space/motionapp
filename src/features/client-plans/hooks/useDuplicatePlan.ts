import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getClientPlan } from "../api/client-plans.api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useDuplicatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId }: { planId: string }) => {
      const original = await getClientPlan(planId);
      
      const { data, error } = await supabase
        .from("client_plans")
        .insert({
          client_id: original.client_id,
          coach_id: original.coach_id,
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
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clientPlans", data.client_id] });
      toast.success("Piano duplicato");
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile duplicare il piano",
      });
    },
  });
}
