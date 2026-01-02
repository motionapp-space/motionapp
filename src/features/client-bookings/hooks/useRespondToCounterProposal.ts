import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acceptCounterProposal, rejectCounterProposal } from "../api/client-bookings.api";
import { toast } from "sonner";
import { useClientAuth } from "@/contexts/ClientAuthContext";

export function useRespondToCounterProposal() {
  const queryClient = useQueryClient();
  const { userId } = useClientAuth();

  const acceptMutation = useMutation({
    mutationFn: acceptCounterProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-appointments-view", userId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Appuntamento confermato", { 
        description: "L'appuntamento è stato aggiunto al calendario" 
      });
    },
    onError: (error: Error) => {
      const message = error.message === "Slot non disponibile" 
        ? "Slot non disponibile" 
        : error.message;
      toast.error("Errore", { description: message });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectCounterProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-appointments-view", userId] });
      toast.success("Controproposta rifiutata");
    },
    onError: (error: Error) => {
      toast.error("Errore", { description: error.message });
    },
  });

  return {
    accept: acceptMutation.mutate,
    reject: rejectMutation.mutate,
    isPending: acceptMutation.isPending || rejectMutation.isPending
  };
}
