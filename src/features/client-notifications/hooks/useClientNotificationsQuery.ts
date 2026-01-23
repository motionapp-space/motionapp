import { useQuery } from "@tanstack/react-query";
import { listClientNotifications } from "../api/client-notifications.api";

export function useClientNotificationsQuery() {
  return useQuery({
    queryKey: ["client-notifications"],
    queryFn: listClientNotifications,
    refetchInterval: 30000, // Poll every 30s
  });
}
