import { useQuery } from "@tanstack/react-query";
import { getClientSessions } from "../api/client-sessions.api";
import { useClientAuth } from "@/contexts/ClientAuthContext";

export function useClientSessions() {
  const { userId } = useClientAuth();

  return useQuery({
    queryKey: ["client-sessions", userId],
    queryFn: getClientSessions,
    staleTime: 60_000,
  });
}
