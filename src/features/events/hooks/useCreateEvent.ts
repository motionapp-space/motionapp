import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEvent } from "../api/events.api";
import { toast } from "sonner";
import { logClientActivity } from "@/features/clients/api/activities.api";

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
      // Log activity
      if (createdEvent.client_id) {
        await logClientActivity(
          createdEvent.client_id,
          "EVENT_CREATED",
          `Appuntamento programmato: ${createdEvent.title || "Sessione"}`
        );
      }

      // Invalidate queries (housekeeping)
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      if (createdEvent.client_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['client-onboarding-events', createdEvent.client_id] 
        });
      }
      
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
