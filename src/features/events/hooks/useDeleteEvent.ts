import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteEvent, getEventById } from "../api/events.api";
import { toast } from "@/hooks/use-toast";
import { logClientActivity } from "@/features/clients/api/activities.api";
import { getCoachClientDetails } from "@/lib/coach-client";
import { supabase } from "@/integrations/supabase/client";
import { buildEventSnapshot, queueBookingEmailWithSnapshot } from "@/lib/email-snapshot";

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Recupera evento PRIMA di eliminare
      const event = await getEventById(id);
      
      // 2. Costruisci snapshot PRIMA dell'eliminazione (dati disponibili)
      let snapshot;
      try {
        snapshot = await buildEventSnapshot(event, 'coach');
      } catch (e) {
        console.warn("Could not build event snapshot for email:", e);
      }
      
      // 3. Elimina evento
      await deleteEvent(id);
      
      // 4. Ritorna entrambi per uso in onSuccess
      return { event, snapshot };
    },
    onSuccess: async ({ event: deletedEvent, snapshot }) => {
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

      // Queue email notification to client usando snapshot (già costruito)
      if (snapshot) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await queueBookingEmailWithSnapshot({
              type: 'appointment_cancelled',
              actorUserId: user.id,
              snapshot,
            });
          }
        } catch (e) {
          console.warn('Failed to queue cancellation email:', e);
        }
      }
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
