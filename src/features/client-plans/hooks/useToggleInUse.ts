import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateClientPlan, getClientPlans } from "../api/client-plans.api";
import { toast } from "sonner";

export function useToggleInUse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      planId, 
      clientId, 
      currentValue 
    }: { 
      planId: string; 
      clientId: string; 
      currentValue: boolean;
    }) => {
      // Se sta attivando, controlla limite 3
      if (!currentValue) {
        const plans = await getClientPlans(clientId);
        const inUsePlans = plans.filter(p => p.is_in_use && p.id !== planId);
        
        if (inUsePlans.length >= 3) {
          throw new Error("MAX_IN_USE_REACHED");
        }
      }

      return updateClientPlan(planId, { is_in_use: !currentValue });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientPlans", variables.clientId] });
      toast.success(
        variables.currentValue 
          ? "Piano rimosso da Attivo" 
          : "Piano impostato come Attivo"
      );
    },
    onError: (error: Error) => {
      if (error.message === "MAX_IN_USE_REACHED") {
        toast.error("Limite raggiunto", {
          description: "Un cliente può avere fino a 3 piani attivi contemporaneamente. Rimuovi uno dei piani attivi per continuare.",
        });
      } else {
        toast.error("Errore", {
          description: error.message || "Impossibile aggiornare il piano",
        });
      }
    },
  });
}
