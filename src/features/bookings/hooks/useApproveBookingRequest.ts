import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveBookingRequest, getBookingRequestById } from "../api/booking-requests.api";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { buildBookingRequestSnapshot, queueBookingEmailWithSnapshot } from "@/lib/email-snapshot";

export function useApproveBookingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      // 1. Recupera request e costruisci snapshot PRIMA dell'approvazione
      const request = await getBookingRequestById(requestId);
      
      // Fetch full request data per lo snapshot
      const { data: fullRequest, error } = await supabase
        .from("booking_requests")
        .select("*")
        .eq("id", requestId)
        .single();
      
      if (error || !fullRequest) throw new Error("Booking request not found");
      
      let snapshot;
      try {
        snapshot = await buildBookingRequestSnapshot(fullRequest, 'coach');
      } catch (e) {
        console.warn("Could not build booking request snapshot:", e);
      }
      
      // 2. Approva
      const result = await approveBookingRequest(requestId);
      
      return { result, snapshot };
    },
    onSuccess: async ({ snapshot }) => {
      queryClient.invalidateQueries({ queryKey: ["booking-requests"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Appuntamento confermato",
        description: "L'evento è stato creato nel calendario.",
      });

      // Queue email notification to client usando snapshot
      if (snapshot) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await queueBookingEmailWithSnapshot({
              type: 'appointment_accepted',
              actorUserId: user.id,
              snapshot,
            });
          }
        } catch (e) {
          console.warn('Failed to queue booking email:', e);
        }
      }
    },
    onError: (error: Error) => {
      const message = error.message === "Slot non disponibile"
        ? "Slot non disponibile. Un altro appuntamento occupa già questo orario."
        : error.message || "Impossibile approvare la richiesta.";
      toast({
        title: "Errore",
        description: message,
        variant: "destructive",
      });
    },
  });
}
