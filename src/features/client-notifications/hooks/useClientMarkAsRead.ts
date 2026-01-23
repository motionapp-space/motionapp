import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  markClientNotificationAsRead,
  markAllClientNotificationsAsRead,
} from "../api/client-notifications.api";
import { toast } from "sonner";

export function useClientMarkAsRead() {
  const queryClient = useQueryClient();

  const markOne = useMutation({
    mutationFn: markClientNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-notifications"] });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile marcare come letta.",
      });
    },
  });

  const markAll = useMutation({
    mutationFn: markAllClientNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-notifications"] });
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
