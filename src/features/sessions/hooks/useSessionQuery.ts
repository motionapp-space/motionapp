import { useQuery } from "@tanstack/react-query";
import { getSession } from "../api/sessions.api";

export function useSessionQuery(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => getSession(sessionId!),
    enabled: !!sessionId,
  });
}
