import { useQuery } from "@tanstack/react-query";
import { listEvents } from "../api/events.api";
import type { EventsFilters } from "../types";

export function useEventsQuery(filters: EventsFilters = {}) {
  return useQuery({
    queryKey: ["events", filters],
    queryFn: () => listEvents(filters),
  });
}
