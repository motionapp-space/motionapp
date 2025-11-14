import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSession } from "../api/sessions.api";
import { toast } from "sonner";
import { logClientActivity } from "@/features/clients/api/activities.api";

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
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile avviare la sessione.",
      });
    },
  });
}
