import { useQuery } from "@tanstack/react-query";
import { getClientActivePlan } from "../api/client-plans.api";

export function useClientActivePlan() {
  return useQuery({
    queryKey: ["client-active-plan"],
    queryFn: () => getClientActivePlan(),
    staleTime: 60_000,
  });
}
