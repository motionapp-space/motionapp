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
  clientId?: string; // FASE 3: ID cliente per regole specifiche
  applyClientRules?: boolean; // FASE 3: Applica regole cliente
}

export function useAvailableSlots({
  coachId,
  startDate,
  endDate,
  enabled = true,
  calendarMode = 'client',
  clientId,
  applyClientRules = false,
}: UseAvailableSlotsOptions) {
  return useQuery({
    queryKey: [
      "available-slots",
      coachId,
      format(startDate, "yyyy-MM-dd"),
      format(endDate, "yyyy-MM-dd"),
      calendarMode,
      clientId,
      applyClientRules,
    ],
    queryFn: () =>
      getAvailableSlots({
        coachId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        calendarMode,
        clientId,
        applyClientRules,
      }),
    enabled,
  });
}
