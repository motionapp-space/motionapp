import { useQuery } from "@tanstack/react-query";
import { getClientRecentActivity } from "../api/client-recent-activity.api";
import { useClientAuth } from "@/contexts/ClientAuthContext";

export function useClientRecentActivity() {
  const { userId } = useClientAuth();

  return useQuery({
    queryKey: ["client-recent-activity", userId],
    queryFn: getClientRecentActivity,
    staleTime: 60_000, // 1 minute
  });
}
