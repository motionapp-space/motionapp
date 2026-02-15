import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getEventById } from "../api/events.api";
import { toast } from "@/hooks/use-toast";
import { logClientActivity } from "@/features/clients/api/activities.api";
import { getCoachClientDetails } from "@/lib/coach-client";
import { supabase } from "@/integrations/supabase/client";
import { buildEventSnapshot, queueBookingEmailWithSnapshot } from "@/lib/email-snapshot";

interface CancelResult {
  status: string;
  already_canceled?: boolean;
  credit_released?: boolean;
  penalty_applied?: boolean;
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Recupera evento PRIMA di cancellare
      const event = await getEventById(id);
      
      // 2. Costruisci snapshot PRIMA della cancellazione (dati disponibili)
      let snapshot;
      try {
        snapshot = await buildEventSnapshot(event, 'coach');
      } catch (e) {
        console.warn("Could not build event snapshot for email:", e);
      }
      
      // 3. Cancella evento via RPC (soft-delete + ledger + trigger notifica)
      const { data, error } = await supabase.rpc('cancel_event_with_ledger', {
        p_event_id: id,
        p_actor: 'coach',
        p_now: new Date().toISOString(),
        p_client_user_id: null,
      });

      if (error) {
        throw new Error(error.message || "Impossibile cancellare l'appuntamento.");
      }

      const result = (typeof data === 'string' ? JSON.parse(data) : data) as CancelResult;
      
      // 4. Ritorna tutto per uso in onSuccess
      return { event, snapshot, result };
    },
    onSuccess: async ({ event: deletedEvent, snapshot, result }) => {
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

      // Invalidate all affected queries
      queryClient.invalidateQueries({ queryKey: ["events"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["packages"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["package-ledger"], exact: false });

      // Toast appropriato in base al risultato della RPC
      if (result?.already_canceled) {
        toast({
          title: "Già cancellato",
          description: "Questo appuntamento era già stato cancellato.",
        });
      } else {
        toast({
          title: "Appuntamento cancellato",
          description: result?.credit_released
            ? "Credito restituito al cliente."
            : "L'appuntamento è stato cancellato con successo.",
        });
      }

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
