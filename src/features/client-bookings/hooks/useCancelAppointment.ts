import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelAppointment } from "../api/client-bookings.api";
import { toast } from "sonner";

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => cancelAppointment(eventId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["client-appointments-view"] });
      queryClient.invalidateQueries({ queryKey: ["client-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["packages"], exact: false });
      
      // Toast dinamico robusto (optional chaining)
      const alreadyCanceled = result?.already_canceled as boolean | undefined;
      const isLate = result?.is_late as boolean | undefined;
      const ledgerAction = result?.ledger_action as string | undefined;
      
      if (alreadyCanceled) {
        toast.info("Appuntamento già annullato");
      } else if (isLate && ledgerAction === 'consume') {
        toast.warning("Cancellazione tardiva", {
          description: "1 credito consumato per cancellazione entro finestra"
        });
      } else if (ledgerAction === 'release') {
        toast.success("Appuntamento annullato", {
          description: "Credito restituito al pacchetto"
        });
      } else {
        toast.success("Appuntamento annullato");
      }
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile annullare l'appuntamento"
      });
    },
  });
}
