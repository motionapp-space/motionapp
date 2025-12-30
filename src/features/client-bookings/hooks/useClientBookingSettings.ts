import { useQuery } from "@tanstack/react-query";
import { getClientBookingSettings } from "../api/client-bookings.api";
import { useClientAuth } from "@/contexts/ClientAuthContext";

export function useClientBookingSettings() {
  const { userId } = useClientAuth();

  return useQuery({
    queryKey: ["client-booking-settings", userId],
    queryFn: getClientBookingSettings,
    staleTime: 60_000,
  });
}
