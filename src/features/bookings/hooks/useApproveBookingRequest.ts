import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveBookingRequest } from "../api/booking-requests.api";
import { toast } from "@/hooks/use-toast";

export function useApproveBookingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveBookingRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-requests"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Appuntamento approvato",
        description: "La richiesta è stata approvata con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile approvare la richiesta.",
        variant: "destructive",
      });
    },
  });
}
