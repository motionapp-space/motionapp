import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateEvent } from "../api/events.api";
import { toast } from "@/hooks/use-toast";
import { logClientActivity } from "@/features/clients/api/activities.api";

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateEvent(id, data),
    onSuccess: async (updatedEvent) => {
      // Log activity
      if (updatedEvent.client_id) {
        await logClientActivity(
          updatedEvent.client_id,
          "EVENT_UPDATED",
          `Appuntamento modificato: ${updatedEvent.title || "Sessione"}`
        );
      }

      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Appuntamento aggiornato",
        description: "L'appuntamento è stato aggiornato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare l'appuntamento.",
        variant: "destructive",
      });
    },
  });
}
