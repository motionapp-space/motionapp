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
        title: "Appuntamento confermato",
        description: "L'evento è stato creato nel calendario.",
      });
    },
    onError: (error: Error) => {
      const message = error.message === "Slot non disponibile"
        ? "Slot non disponibile. Un altro appuntamento occupa già questo orario."
        : error.message || "Impossibile approvare la richiesta.";
      toast({
        title: "Errore",
        description: message,
        variant: "destructive",
      });
    },
  });
}
