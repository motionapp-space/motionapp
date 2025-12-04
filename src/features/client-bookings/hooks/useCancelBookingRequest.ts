import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelBookingRequest } from "../api/client-bookings.api";
import { toast } from "sonner";

export function useCancelBookingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => cancelBookingRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-appointments-view"] });
      toast.success("Richiesta annullata");
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile annullare la richiesta"
      });
    },
  });
}
