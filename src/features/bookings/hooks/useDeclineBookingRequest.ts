import { useMutation, useQueryClient } from "@tanstack/react-query";
import { declineBookingRequest } from "../api/booking-requests.api";
import { toast } from "@/hooks/use-toast";

export function useDeclineBookingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: declineBookingRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-requests"] });
      toast({
        title: "Richiesta rifiutata",
        description: "La richiesta è stata rifiutata.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile rifiutare la richiesta.",
        variant: "destructive",
      });
    },
  });
}
