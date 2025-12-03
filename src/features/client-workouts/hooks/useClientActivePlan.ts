import { useQuery } from "@tanstack/react-query";
import { getClientActivePlan } from "../api/client-plans.api";

export function useClientActivePlan(clientId: string | undefined) {
  return useQuery({
    queryKey: ["client-active-plan", clientId],
    queryFn: () => getClientActivePlan(clientId!),
    enabled: !!clientId,
    staleTime: 60_000,
  });
}
