import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSession } from "../api/sessions.api";
import { toast } from "sonner";
import { logClientActivity } from "@/features/clients/api/activities.api";
import { useSessionStore } from "@/stores/useSessionStore";
import { deleteEvent } from "@/features/events/api/events.api";

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updateSession(id, updates),
    onSuccess: async (session) => {
      // Log activity when session is completed
      if (session.status === "completed") {
        await logClientActivity(
          session.client_id,
          "SESSION_COMPLETED",
          "Sessione live completata"
        );
      }

      // Gestisci evento collegato quando sessione viene cancellata o completata
      if (session.event_id) {
        if (session.status === "cancelled") {
          // Cancella l'evento quando la sessione viene annullata
          try {
            await deleteEvent(session.event_id);
          } catch (error) {
            console.error("Error deleting event:", error);
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session", session.id] });
      
      // Aggiorna immediatamente lo store globale quando la sessione termina
      if (session.status === "completed" || session.status === "cancelled") {
        useSessionStore.getState().clearActiveSession();
      }
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile aggiornare la sessione.",
      });
    },
  });
}
