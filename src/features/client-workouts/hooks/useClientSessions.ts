import { useQuery } from "@tanstack/react-query";
import { getClientSessions } from "../api/client-sessions.api";

export function useClientSessions(clientId: string | undefined) {
  return useQuery({
    queryKey: ["client-sessions", clientId],
    queryFn: () => getClientSessions(clientId!),
    enabled: !!clientId,
    staleTime: 60_000,
  });
}
