import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePendingCount() {
  return useQuery({
    queryKey: ["booking-requests-pending-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from("booking_requests")
        .select("*", { count: "exact", head: true })
        .eq("coach_id", user.id)
        .eq("status", "PENDING");

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
