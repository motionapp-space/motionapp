import { useMutation, useQueryClient } from "@tanstack/react-query";
import { counterProposeBookingRequest } from "../api/booking-requests.api";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { buildBookingRequestSnapshot, queueBookingEmailWithSnapshot } from "@/lib/email-snapshot";

export function useCounterProposeBookingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, startAt, endAt }: { id: string; startAt: string; endAt: string }) => {
      // 1. Fetch full request data PRIMA della controproposta
      const { data: fullRequest, error } = await supabase
        .from("booking_requests")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error || !fullRequest) throw new Error("Booking request not found");
      
      // 2. Aggiorna request con controproposta
      await counterProposeBookingRequest(id, startAt, endAt);
      
      // 3. Costruisci snapshot con i nuovi dati della controproposta
      // Aggiorniamo manualmente i campi della controproposta nello snapshot
      let snapshot;
      try {
        snapshot = await buildBookingRequestSnapshot({
          ...fullRequest,
          counter_proposal_start_at: startAt,
          counter_proposal_end_at: endAt,
        }, 'coach');
      } catch (e) {
        console.warn("Could not build booking request snapshot:", e);
      }
      
      return { snapshot };
    },
    onSuccess: async ({ snapshot }) => {
      queryClient.invalidateQueries({ queryKey: ["booking-requests"] });
      toast({
        title: "Controproposta inviata",
        description: "La controproposta è stata inviata al cliente.",
      });

      // Queue counter-proposal email notification to client usando snapshot
      if (snapshot) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await queueBookingEmailWithSnapshot({
              type: 'appointment_counter_proposed',
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
        description: error.message || "Impossibile inviare la controproposta.",
        variant: "destructive",
      });
    },
  });
}
