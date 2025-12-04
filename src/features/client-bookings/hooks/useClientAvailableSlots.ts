import { useQuery } from "@tanstack/react-query";
import { getAvailableSlotsForClient } from "../api/client-bookings.api";
import { addDays, startOfDay } from "date-fns";

export function useClientAvailableSlots(daysAhead: number = 14) {
  const startDate = startOfDay(new Date());
  const endDate = addDays(startDate, daysAhead);

  return useQuery({
    queryKey: ["client-available-slots", daysAhead],
    queryFn: () => getAvailableSlotsForClient(startDate, endDate),
    staleTime: 60_000,
  });
}
