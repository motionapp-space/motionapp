import { useMutation, useQueryClient } from "@tanstack/react-query";
import { counterProposeBookingRequest } from "../api/booking-requests.api";
import { toast } from "@/hooks/use-toast";

export function useCounterProposeBookingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, startAt, endAt }: { id: string; startAt: string; endAt: string }) =>
      counterProposeBookingRequest(id, startAt, endAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-requests"] });
      toast({
        title: "Controproposta inviata",
        description: "La controproposta è stata inviata al cliente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile inviare la controproposta.",
        variant: "destructive",
      });
    },
  });
}
