import { useQuery } from "@tanstack/react-query";
import { getClientAppointments, type ClientAppointment } from "../api/client-appointments.api";

export function useClientAppointments(clientId: string) {
  return useQuery<ClientAppointment[]>({
    queryKey: ["client-appointments", clientId],
    queryFn: () => getClientAppointments(clientId),
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000, // 2 minuti
  });
}
