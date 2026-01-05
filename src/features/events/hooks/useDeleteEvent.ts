import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteEvent, getEventById } from "../api/events.api";
import { toast } from "@/hooks/use-toast";
import { logClientActivity } from "@/features/clients/api/activities.api";
import { getCoachClientDetails } from "@/lib/coach-client";

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get event before deletion to have coach_client_id and title
      const event = await getEventById(id);
      await deleteEvent(id);
      return event;
    },
    onSuccess: async (deletedEvent) => {
      // Get client_id from coach_client relationship
      try {
        const { client_id: clientId } = await getCoachClientDetails(deletedEvent.coach_client_id);
        
        // Log activity
        if (clientId) {
          await logClientActivity(
            clientId,
            "EVENT_DELETED",
            `Appuntamento eliminato: ${deletedEvent.title || "Sessione"}`
          );
        }
      } catch (error) {
        console.warn("Could not get client details for activity log:", error);
      }

      queryClient.invalidateQueries({ queryKey: ["events"], exact: false });
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
