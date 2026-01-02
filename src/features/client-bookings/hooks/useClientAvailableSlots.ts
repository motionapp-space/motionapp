import { useQuery } from "@tanstack/react-query";
import { getAvailableSlotsForClient } from "../api/client-bookings.api";
import { addDays, startOfDay } from "date-fns";

// Export query key generator for consistent invalidation
export const clientAvailableSlotsQueryKey = (daysAhead: number) => 
  ["client-available-slots", daysAhead] as const;

export function useClientAvailableSlots(daysAhead: number = 14) {
  const startDate = startOfDay(new Date());
  const endDate = addDays(startDate, daysAhead);

  return useQuery({
    queryKey: clientAvailableSlotsQueryKey(daysAhead),
    queryFn: () => getAvailableSlotsForClient(startDate, endDate),
    staleTime: 60_000,
  });
}
