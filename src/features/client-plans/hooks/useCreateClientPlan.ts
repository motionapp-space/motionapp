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
      objective,
      days 
    }: {
      clientId: string;
      name: string;
      description?: string;
      objective?: string;
      days: any;
    }) =>
      createClientPlanFromScratch(clientId, {
        name,
        description,
        objective,
        data: { days },
      }),
    onSuccess: (plan, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientPlans", variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['client-onboarding-plans', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-plans-check'] });
    },
    onError: (error: any) => {
      if (error.message?.includes('name')) {
        toast.error("Il nome del piano è obbligatorio");
      } else if (error.code === '23505') {
        toast.error("Esiste già un piano con questo nome");
      } else {
        toast.error("Errore nella creazione del piano", {
          description: error.message || "Riprova più tardi"
        });
      }
    },
  });
}
