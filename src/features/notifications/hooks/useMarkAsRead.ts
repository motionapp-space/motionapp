import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markAsRead, markAllAsRead } from "../api/notifications.api";
import { toast } from "sonner";

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  const markOne = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile marcare come letta.",
      });
    },
  });

  const markAll = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Tutte le notifiche sono state marchiate come lette");
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile marcare come lette.",
      });
    },
  });

  return { markOne, markAll };
}
