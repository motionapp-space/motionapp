import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSession } from "../api/sessions.api";
import { toast } from "sonner";
import { logClientActivity } from "@/features/clients/api/activities.api";
import { useSessionStore } from "@/stores/useSessionStore";

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

      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session", session.id] });
      
      // Aggiorna immediatamente lo store globale quando la sessione termina
      if (session.status === "completed" || session.status === "interrupted") {
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
