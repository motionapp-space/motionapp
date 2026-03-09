import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteEvent, getEventById } from "../api/events.api";
import { findPackageForEvent, handleEventCancel } from "@/features/packages/api/calendar-integration.api";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logClientActivity } from "@/features/clients/api/activities.api";
import { getCoachClientDetails } from "@/lib/coach-client";
import { invalidateDashboardQueries } from "@/features/dashboard/lib/invalidateDashboardQueries";
import { dashboardQueryKeys } from "@/features/dashboard/lib/dashboardQueryKeys";

interface CancelEventInput {
  eventId: string;
  isCoachCancelling?: boolean;
}

export function useCancelEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, isCoachCancelling = true }: CancelEventInput) => {
      // Get event details before deletion
      const event = await getEventById(eventId);
      
      // Get client_id from coach_client relationship
      const { client_id: clientId } = await getCoachClientDetails(event.coach_client_id);
      
      // Try to find associated package
      const packageId = await findPackageForEvent(eventId);
      
      if (!packageId) {
        // Historic event without package - just delete
        await deleteEvent(eventId);
        return { event, clientId, penaltyApplied: false, hasPackage: false };
      }

      // Handle cancellation with package credit management
      let penaltyApplied = false;
      
      if (isCoachCancelling) {
        // Professional always releases credit without penalty
        const result = await handleEventCancel(
          eventId,
          packageId,
          event.start_at,
          { forceFree: true }
        );
        penaltyApplied = result.penaltyApplied;
      } else {
        // Client cancellation - apply lock window logic
        const result = await handleEventCancel(
          eventId,
          packageId,
          event.start_at
        );
        penaltyApplied = result.penaltyApplied;
      }

      // Delete the event
      await deleteEvent(eventId);
      
      return { event, clientId, penaltyApplied, hasPackage: true };
    },
    onSuccess: ({ event, clientId, penaltyApplied, hasPackage }) => {
      // Log activity
      if (clientId) {
        logClientActivity(
          clientId,
          "EVENT_DELETED",
          `Appuntamento cancellato: ${event.title || "Sessione"}`
        );
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["events"], exact: false });
      
      // Solo se ha package, invalida package-related queries
      if (hasPackage) {
        queryClient.invalidateQueries({ queryKey: ["packages"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["package-ledger"], exact: false });
      }

      // Show appropriate toast
      if (!hasPackage) {
        toast.info("Appuntamento cancellato", {
          description: "Evento storico senza gestione crediti"
        });
      } else if (penaltyApplied) {
        toast.warning("Cancellazione tardiva", {
          description: "1 credito consumato per cancellazione entro lock window"
        });
      } else {
        toast.success("Appuntamento cancellato", {
          description: "Credito restituito al cliente"
        });
      }
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile cancellare l'appuntamento"
      });
    },
  });
}
