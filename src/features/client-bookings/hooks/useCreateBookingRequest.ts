import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBookingRequest } from "../api/client-bookings.api";
import { toast } from "sonner";
import type { CreateBookingRequestInput } from "../types";
import { clientAvailableSlotsQueryKey } from "./useClientAvailableSlots";

export function useCreateBookingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBookingRequestInput) => createBookingRequest(input),
    onSuccess: () => {
      // Invalidate both appointments view and available slots
      queryClient.invalidateQueries({ queryKey: ["client-appointments-view"] });
      queryClient.invalidateQueries({ queryKey: clientAvailableSlotsQueryKey(28) });
      toast.success("Richiesta inviata", {
        description: "In attesa di conferma dal coach"
      });
    },
    // Error handling is done in the component for granular control
  });
}
