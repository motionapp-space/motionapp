import { useQuery } from "@tanstack/react-query";
import { getClientPlansWithActive } from "../api/client-plans.api";

export function useClientPlansQuery(clientId: string) {
  return useQuery({
    queryKey: ["clientPlans", clientId],
    queryFn: () => getClientPlansWithActive(clientId),
    enabled: !!clientId,
  });
}
