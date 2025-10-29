import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSession } from "../api/sessions.api";
import { toast } from "sonner";

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updateSession(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session", data.id] });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile aggiornare la sessione.",
      });
    },
  });
}
