import { useMutation, useQueryClient } from "@tanstack/react-query";
import { declineBookingRequest } from "../api/booking-requests.api";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/**
 * Helper to queue booking-related emails via edge function
 */
async function queueBookingEmail(params: {
  type: 'request_created' | 'accepted' | 'counter_proposed' | 'cancelled';
  bookingRequestId?: string;
  eventId?: string;
  actorUserId: string;
}): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('queue-booking-email', {
      body: params
    });
    if (error) {
      console.warn('[queueBookingEmail] Failed to queue email:', error);
    }
  } catch (e) {
    console.warn('[queueBookingEmail] Failed to queue email:', e);
  }
}

export function useDeclineBookingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: declineBookingRequest,
    onSuccess: async (_, requestId) => {
      queryClient.invalidateQueries({ queryKey: ["booking-requests"] });
      toast({
        title: "Richiesta rifiutata",
        description: "La richiesta è stata rifiutata.",
      });

      // Queue cancellation email notification to client
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await queueBookingEmail({
            type: 'cancelled',
            bookingRequestId: requestId,
            actorUserId: user.id,
          });
        }
      } catch (e) {
        console.warn('Failed to queue booking email:', e);
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
