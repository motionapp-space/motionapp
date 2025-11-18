import { useQuery } from "@tanstack/react-query";
import { getAvailableSlots } from "../api/available-slots.api";
import { format } from "date-fns";

interface UseAvailableSlotsOptions {
  coachId: string;
  startDate: Date;
  endDate: Date;
  enabled?: boolean;
  isCoachView?: boolean;
  bypassEnabledCheck?: boolean;
}

export function useAvailableSlots({
  coachId,
  startDate,
  endDate,
  enabled = true,
  isCoachView = true,
  bypassEnabledCheck = false,
}: UseAvailableSlotsOptions) {
  return useQuery({
    queryKey: [
      "available-slots",
      coachId,
      format(startDate, "yyyy-MM-dd"),
      format(endDate, "yyyy-MM-dd"),
      isCoachView,
      bypassEnabledCheck,
    ],
    queryFn: () =>
      getAvailableSlots({
        coachId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isCoachView,
        bypassEnabledCheck,
      }),
    enabled,
  });
}
