import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBookingRequest } from "../api/client-bookings.api";
import { toast } from "sonner";
import type { CreateBookingRequestInput } from "../types";

export function useCreateBookingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBookingRequestInput) => createBookingRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-appointments-view"] });
      toast.success("Richiesta inviata", {
        description: "In attesa di conferma dal coach"
      });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile inviare la richiesta"
      });
    },
  });
}
