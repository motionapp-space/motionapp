import { useQuery } from "@tanstack/react-query";
import { getClientAppointments } from "../api/client-bookings.api";

export function useClientAppointmentsView() {
  return useQuery({
    queryKey: ["client-appointments-view"],
    queryFn: getClientAppointments,
    staleTime: 30_000,
  });
}
