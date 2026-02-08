import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePlan } from "@/features/clients/api/client-fsm.api";
import { toast } from "@/hooks/use-toast";

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, planId, version }: { clientId: string; planId: string; version?: number }) =>
      deletePlan(clientId, planId, version),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client-plans"] });
      queryClient.invalidateQueries({ queryKey: ["clientPlans", variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-plans-check'] });
      queryClient.invalidateQueries({ queryKey: ['client-onboarding-plans', variables.clientId] });
      toast({
        title: "Piano eliminato",
        description: "Il piano è stato eliminato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare il piano.",
        variant: "destructive",
      });
    },
  });
}