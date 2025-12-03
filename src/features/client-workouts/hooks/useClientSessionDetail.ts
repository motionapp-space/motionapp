import { useQuery } from "@tanstack/react-query";
import { getClientSessionActuals } from "../api/client-sessions.api";

export function useClientSessionDetail(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["client-session-detail", sessionId],
    queryFn: () => getClientSessionActuals(sessionId!),
    enabled: !!sessionId,
  });
}
