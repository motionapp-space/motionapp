import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acceptChangeProposal, rejectChangeProposal } from "../api/client-bookings.api";
import { toast } from "sonner";

export function useRespondToChangeProposal() {
  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    mutationFn: (eventId: string) => acceptChangeProposal(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-appointments-view"] });
      queryClient.invalidateQueries({ queryKey: ["client-appointments"] });
      toast.success("Appuntamento confermato", {
        description: "Nuovo orario accettato"
      });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile accettare la proposta"
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (eventId: string) => rejectChangeProposal(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-appointments-view"] });
      queryClient.invalidateQueries({ queryKey: ["client-appointments"] });
      toast.success("Proposta rifiutata", {
        description: "L'appuntamento è stato annullato"
      });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile rifiutare la proposta"
      });
    },
  });

  return {
    accept: acceptMutation.mutate,
    reject: rejectMutation.mutate,
    isAccepting: acceptMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isPending: acceptMutation.isPending || rejectMutation.isPending
  };
}
