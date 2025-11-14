import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEvent } from "../api/events.api";
import { toast } from "@/hooks/use-toast";
import { logClientActivity } from "@/features/clients/api/activities.api";

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvent,
    onSuccess: async (createdEvent) => {
      // Log activity
      await logClientActivity(
        createdEvent.client_id,
        "EVENT_CREATED",
        `Appuntamento programmato: ${createdEvent.title || "Sessione"}`
      );

      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Appuntamento creato",
        description: "L'appuntamento è stato creato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare l'appuntamento.",
        variant: "destructive",
      });
    },
  });
}
