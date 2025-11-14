import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteEvent, getEventById } from "../api/events.api";
import { toast } from "@/hooks/use-toast";
import { logClientActivity } from "@/features/clients/api/activities.api";

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get event before deletion to have client_id and title
      const event = await getEventById(id);
      await deleteEvent(id);
      return event;
    },
    onSuccess: async (deletedEvent) => {
      // Log activity
      if (deletedEvent.client_id) {
        await logClientActivity(
          deletedEvent.client_id,
          "EVENT_DELETED",
          `Appuntamento eliminato: ${deletedEvent.title || "Sessione"}`
        );
      }

      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Appuntamento eliminato",
        description: "L'appuntamento è stato eliminato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare l'appuntamento.",
        variant: "destructive",
      });
    },
  });
}
