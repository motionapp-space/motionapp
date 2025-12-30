import { useQuery } from "@tanstack/react-query";
import { getClientAppointments } from "../api/client-bookings.api";
import { useClientAuth } from "@/contexts/ClientAuthContext";

export function useClientAppointmentsView() {
  const { userId } = useClientAuth();

  return useQuery({
    queryKey: ["client-appointments-view", userId],
    queryFn: getClientAppointments,
    staleTime: 30_000,
  });
}
