import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEvent } from "../api/events.api";
import { toast } from "sonner";
import { logClientActivity } from "@/features/clients/api/activities.api";
import { handleEventConfirm } from "@/features/packages/api/calendar-integration.api";

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

      // Auto-conferma con hold credito
      if (createdEvent.client_id && createdEvent.source !== 'client') {
        try {
          await handleEventConfirm(
            createdEvent.id,
            createdEvent.client_id,
            createdEvent.start_at
          );
          
          queryClient.invalidateQueries({ queryKey: ["events"] });
          queryClient.invalidateQueries({ queryKey: ["clients"] });
          queryClient.invalidateQueries({ queryKey: ["packages"] });
          queryClient.invalidateQueries({ queryKey: ['client-onboarding-events', createdEvent.client_id] });
          
          toast.success("Appuntamento creato", {
            description: "1 credito prenotato dal pacchetto",
          });
        } catch (error: any) {
          // Se fallisce (es: no package, no credits), avvisa ma non blocca
          queryClient.invalidateQueries({ queryKey: ["events"] });
          queryClient.invalidateQueries({ queryKey: ["clients"] });
          queryClient.invalidateQueries({ queryKey: ['client-onboarding-events', createdEvent.client_id] });
          
          toast.warning("Appuntamento creato senza gestione crediti", {
            description: error.message || "Nessun pacchetto attivo trovato",
          });
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ["events"] });
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        queryClient.invalidateQueries({ queryKey: ['client-onboarding-events', createdEvent.client_id] });
        
        toast.success("Appuntamento creato");
      }
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile creare l'appuntamento.",
      });
    },
  });
}
