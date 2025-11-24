import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClientPlanFromScratch } from "../api/client-plans.api";
import { toast } from "sonner";

export function useCreateClientPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      clientId, 
      name, 
      description, 
      days 
    }: {
      clientId: string;
      name: string;
      description?: string;
      days: any;
    }) =>
      createClientPlanFromScratch(clientId, {
        name,
        description,
        data: { days },
      }),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: ["clientPlans", plan.client_id] });
    },
    onError: () => {
      toast.error("Errore nella creazione del piano");
    },
  });
}
