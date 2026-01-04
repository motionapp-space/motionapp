import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCoachClientId } from "@/lib/coach-client";

export function useDeletePlanPermanent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      clientId, 
      planId 
    }: { 
      clientId: string;
      planId: string;
    }) => {
      const coachClientId = await getCoachClientId(clientId);
      
      const { data, error } = await supabase.rpc('delete_plan', {
        p_coach_client_id: coachClientId,
        p_plan_id: planId,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientPlans", variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-plans"] });
      toast.success("Piano eliminato");
    },
    onError: (error: Error) => {
      toast.error("Errore", { description: error.message });
    },
  });
}
