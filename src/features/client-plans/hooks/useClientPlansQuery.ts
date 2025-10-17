import { useQuery } from "@tanstack/react-query";
import { getClientPlans } from "../api/client-plans.api";

export function useClientPlansQuery(clientId: string) {
  return useQuery({
    queryKey: ["clientPlans", clientId],
    queryFn: () => getClientPlans(clientId),
    enabled: !!clientId,
  });
}
