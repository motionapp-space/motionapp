import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePlan } from "@/features/clients/api/client-fsm.api";
import { toast } from "@/hooks/use-toast";
import type { ClientPlanWithActive } from "../types";

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, planId, version }: { 
      clientId: string; 
      planId: string; 
      version?: number 
    }) => deletePlan(clientId, planId, version),
    
    // OPTIMISTIC UPDATE: rimuovi subito dalla cache
    onMutate: async (variables) => {
      // Annulla query in corso per evitare conflitti
      await queryClient.cancelQueries({ 
        queryKey: ["clientPlans", variables.clientId] 
      });

      // Salva stato precedente per rollback
      const previousPlans = queryClient.getQueryData<ClientPlanWithActive[]>(
        ["clientPlans", variables.clientId]
      );

      // Aggiorna la cache rimuovendo il piano
      queryClient.setQueryData<ClientPlanWithActive[]>(
        ["clientPlans", variables.clientId],
        (old) => old?.filter(plan => plan.id !== variables.planId) ?? []
      );

      // Ritorna contesto per rollback
      return { previousPlans };
    },
    
    onSuccess: (_, variables) => {
      // Invalida query correlate per sincronizzazione
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-plans-check"] });
      queryClient.invalidateQueries({ 
        queryKey: ["client-onboarding-plans", variables.clientId] 
      });
      
      toast({
        title: "Piano eliminato",
        description: "Il piano è stato eliminato con successo.",
      });
    },
    
    // ROLLBACK: ripristina in caso di errore
    onError: (error: Error, variables, context) => {
      if (context?.previousPlans) {
        queryClient.setQueryData(
          ["clientPlans", variables.clientId],
          context.previousPlans
        );
      }
      
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare il piano.",
        variant: "destructive",
      });
    },
    
    // Refetch finale per garantire sincronizzazione
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["clientPlans", variables.clientId] 
      });
    },
  });
}