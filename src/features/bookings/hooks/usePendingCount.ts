import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePendingCount() {
  return useQuery({
    queryKey: ["booking-requests-pending-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      // Get coach_clients for this coach
      const { data: coachClients } = await supabase
        .from("coach_clients")
        .select("id")
        .eq("coach_id", user.id);

      if (!coachClients || coachClients.length === 0) return 0;

      const { count, error } = await supabase
        .from("booking_requests")
        .select("*", { count: "exact", head: true })
        .in("coach_client_id", coachClients.map(cc => cc.id))
        .eq("status", "PENDING");

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
