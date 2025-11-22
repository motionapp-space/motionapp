import { useQuery } from "@tanstack/react-query";
import { getAvailableSlots } from "../api/available-slots.api";
import { format } from "date-fns";
import type { CalendarMode } from "@/features/events/types";

interface UseAvailableSlotsOptions {
  coachId: string;
  startDate: Date;
  endDate: Date;
  enabled?: boolean;
  calendarMode?: CalendarMode; // FASE 2: Passare mode
}

export function useAvailableSlots({
  coachId,
  startDate,
  endDate,
  enabled = true,
  calendarMode = 'client',
}: UseAvailableSlotsOptions) {
  return useQuery({
    queryKey: [
      "available-slots",
      coachId,
      format(startDate, "yyyy-MM-dd"),
      format(endDate, "yyyy-MM-dd"),
      calendarMode,
    ],
    queryFn: () =>
      getAvailableSlots({
        coachId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        calendarMode,
      }),
    enabled,
  });
}
