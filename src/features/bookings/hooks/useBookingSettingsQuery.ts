import { useQuery } from "@tanstack/react-query";
import { getBookingSettings } from "../api/booking-settings.api";

export function useBookingSettingsQuery() {
  return useQuery({
    queryKey: ["booking-settings"],
    queryFn: getBookingSettings,
  });
}
