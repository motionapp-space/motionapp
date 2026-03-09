import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEvent } from "../api/events.api";
import { toast } from "sonner";
import { logClientActivity } from "@/features/clients/api/activities.api";
import { getCoachClientDetails } from "@/lib/coach-client";
import { invalidateDashboardQueries } from "@/features/dashboard/lib/invalidateDashboardQueries";
import { dashboardQueryKeys } from "@/features/dashboard/lib/dashboardQueryKeys";

/**
 * Hook for creating events
 * Simplified: only handles event creation + activity logging + cache invalidation
 * Package confirmation logic is handled by EventEditorModal
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvent,
    onSuccess: async (createdEvent) => {
      // Get client_id from coach_client relationship
      try {
        const { client_id: clientId } = await getCoachClientDetails(createdEvent.coach_client_id);
        
        // Log activity
        if (clientId) {
          await logClientActivity(
            clientId,
            "EVENT_CREATED",
            `Appuntamento programmato: ${createdEvent.title || "Sessione"}`
          );
          
          queryClient.invalidateQueries({ 
            queryKey: ['client-onboarding-events', clientId] 
          });
        }
      } catch (error) {
        console.warn("Could not get client details for activity log:", error);
      }

      // Invalidate queries (housekeeping)
      queryClient.invalidateQueries({ queryKey: ["events"], exact: false });
      
      // NO toast here - handled by EventEditorModal
      // NO package logic here - handled by EventEditorModal
    },
    onError: (error: Error) => {
      // Centralized error handling
      toast.error("Errore", {
        description: error.message || "Impossibile creare l'appuntamento.",
      });
    },
  });
}
