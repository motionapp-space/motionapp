import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completePlan } from "@/features/clients/api/client-fsm.api";
import { toast } from "@/hooks/use-toast";

export function useCompletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, planId, version }: { clientId: string; planId: string; version?: number }) =>
      completePlan(clientId, planId, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-plans"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-plans-check'] });
      toast({
        title: "Piano completato",
        description: "Il piano è stato completato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile completare il piano.",
        variant: "destructive",
      });
    },
  });
}