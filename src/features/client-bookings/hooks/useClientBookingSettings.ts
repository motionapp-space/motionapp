import { useQuery } from "@tanstack/react-query";
import { getClientBookingSettings } from "../api/client-bookings.api";

export function useClientBookingSettings() {
  return useQuery({
    queryKey: ["client-booking-settings"],
    queryFn: getClientBookingSettings,
    staleTime: 60_000,
  });
}
