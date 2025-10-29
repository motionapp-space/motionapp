import { useQuery } from "@tanstack/react-query";
import { listActuals } from "../api/actuals.api";

export function useActualsQuery(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["actuals", sessionId],
    queryFn: () => listActuals(sessionId!),
    enabled: !!sessionId,
    refetchInterval: 5000, // Auto-refresh every 5s
  });
}
