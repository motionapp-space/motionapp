import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateClientPlan } from "../api/client-plans.api";
import type { ClientPlan } from "@/types/template";
import { toast } from "sonner";

export function useUpdateClientPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ClientPlan> }) =>
      updateClientPlan(id, updates),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["clientPlans", data.client_id] });
      queryClient.invalidateQueries({ queryKey: ["clientPlan", data.id] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-plans-check'] });
      
      // Show notification if other plans were auto-completed
      if (data._autoCompletedCount && data._autoCompletedCount > 0) {
        toast.success(
          "Piano attivato",
          {
            description: data._autoCompletedCount === 1
              ? "Il piano precedente è stato automaticamente completato."
              : `${data._autoCompletedCount} piani precedenti sono stati automaticamente completati.`,
          }
        );
      }
    },
  });
}
