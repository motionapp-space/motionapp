import { useQuery } from "@tanstack/react-query";
import { getClientSessions } from "../api/client-sessions.api";

export function useClientSessions() {
  return useQuery({
    queryKey: ["client-sessions"],
    queryFn: () => getClientSessions(),
    staleTime: 60_000,
  });
}
