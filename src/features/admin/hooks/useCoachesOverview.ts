import { useQuery } from "@tanstack/react-query";
import { fetchCoachesOverview } from "../api/coaches.api";

export function useCoachesOverview() {
  return useQuery({
    queryKey: ["admin", "coaches-overview"],
    queryFn: fetchCoachesOverview,
    staleTime: 2 * 60 * 1000,
  });
}
