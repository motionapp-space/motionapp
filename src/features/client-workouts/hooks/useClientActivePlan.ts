import { useQuery } from "@tanstack/react-query";
import { getClientActivePlan } from "../api/client-plans.api";
import { useClientAuth } from "@/contexts/ClientAuthContext";

export function useClientActivePlan() {
  const { userId } = useClientAuth();

  return useQuery({
    queryKey: ["client-active-plan", userId],
    queryFn: getClientActivePlan,
    staleTime: 60_000,
  });
}
