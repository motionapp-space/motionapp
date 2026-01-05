import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateEvent } from "../api/events.api";
import { toast } from "@/hooks/use-toast";
import { logClientActivity } from "@/features/clients/api/activities.api";
import { getCoachClientDetails } from "@/lib/coach-client";

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateEvent(id, data),
    onSuccess: async (updatedEvent) => {
      // Get client_id from coach_client relationship
      try {
        const { client_id: clientId } = await getCoachClientDetails(updatedEvent.coach_client_id);
        
        // Log activity
        if (clientId) {
          await logClientActivity(
            clientId,
            "EVENT_UPDATED",
            `Appuntamento modificato: ${updatedEvent.title || "Sessione"}`
          );
        }
      } catch (error) {
        console.warn("Could not get client details for activity log:", error);
      }

      queryClient.invalidateQueries({ queryKey: ["events"], exact: false });
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
