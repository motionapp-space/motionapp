import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelAppointment } from "../api/client-bookings.api";
import { toast } from "sonner";

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => cancelAppointment(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-appointments-view"] });
      queryClient.invalidateQueries({ queryKey: ["client-appointments"] });
      toast.success("Appuntamento annullato");
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile annullare l'appuntamento"
      });
    },
  });
}
