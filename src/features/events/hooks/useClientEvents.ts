import { useQuery } from "@tanstack/react-query";
import { getClientEvents, getNextAppointment, getLastAppointment } from "../api/events.api";

export function useClientEvents(clientId: string) {
  return useQuery({
    queryKey: ["events", "client", clientId],
    queryFn: () => getClientEvents(clientId),
    enabled: !!clientId,
  });
}

export function useNextAppointment(clientId: string) {
  return useQuery({
    queryKey: ["events", "client", clientId, "next"],
    queryFn: () => getNextAppointment(clientId),
    enabled: !!clientId,
  });
}

export function useLastAppointment(clientId: string) {
  return useQuery({
    queryKey: ["events", "client", clientId, "last"],
    queryFn: () => getLastAppointment(clientId),
    enabled: !!clientId,
  });
}
