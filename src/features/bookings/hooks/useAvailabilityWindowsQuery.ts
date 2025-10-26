import { useQuery } from "@tanstack/react-query";
import { listAvailabilityWindows } from "../api/availability-windows.api";

export function useAvailabilityWindowsQuery() {
  return useQuery({
    queryKey: ["availability-windows"],
    queryFn: listAvailabilityWindows,
  });
}
