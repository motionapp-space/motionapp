import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSession } from "../api/sessions.api";
import { toast } from "sonner";
import { logClientActivity } from "@/features/clients/api/activities.api";
import { useSessionStore } from "@/stores/useSessionStore";

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSession,
    onSuccess: async (session) => {
      // Log activity
      await logClientActivity(
        session.client_id,
        "SESSION_STARTED",
        "Sessione live iniziata"
      );

      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      
      // Aggiorna immediatamente lo store globale per riflettere la sessione attiva
      useSessionStore.getState().fetchActiveSession();
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile avviare la sessione.",
      });
    },
  });
}
