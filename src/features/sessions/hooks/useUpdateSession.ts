import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSession } from "../api/sessions.api";
import { toast } from "sonner";
import { logClientActivity } from "@/features/clients/api/activities.api";
import { useSessionStore } from "@/stores/useSessionStore";

/**
 * Hook for updating training sessions
 * Sessions are decoupled from events - they only manage training_sessions table
 * Event management (calendar/packages) is handled separately
 */
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

      // NOTE: We no longer delete events when sessions are cancelled
      // Sessions = performance tracking
      // Events = calendar/payment tracking (managed separately)

      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session", session.id] });
      
      // Update global store immediately when session ends
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
