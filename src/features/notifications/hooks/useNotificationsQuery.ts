import { useQuery } from "@tanstack/react-query";
import { listNotifications } from "../api/notifications.api";

export function useNotificationsQuery() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
    refetchInterval: 30000, // Poll every 30s
  });
}
