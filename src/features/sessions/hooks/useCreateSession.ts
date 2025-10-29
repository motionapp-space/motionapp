import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSession } from "../api/sessions.api";
import { toast } from "sonner";

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile avviare la sessione.",
      });
    },
  });
}
