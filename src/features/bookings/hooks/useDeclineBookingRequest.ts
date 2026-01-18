import { useMutation, useQueryClient } from "@tanstack/react-query";
import { declineBookingRequest } from "../api/booking-requests.api";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { buildBookingRequestSnapshot, queueBookingEmailWithSnapshot } from "@/lib/email-snapshot";

export function useDeclineBookingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      // 1. Fetch full request data per lo snapshot PRIMA del decline
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
      
      // 2. Decline
      await declineBookingRequest(requestId);
      
      return { snapshot };
    },
    onSuccess: async ({ snapshot }) => {
      queryClient.invalidateQueries({ queryKey: ["booking-requests"] });
      toast({
        title: "Richiesta rifiutata",
        description: "La richiesta è stata rifiutata.",
      });

      // Queue cancellation email notification to client usando snapshot
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
          console.warn('Failed to queue booking email:', e);
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile rifiutare la richiesta.",
        variant: "destructive",
      });
    },
  });
}
