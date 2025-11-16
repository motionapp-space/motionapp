import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface OccupiedSlot {
  id: string;
  start: string;
  end: string;
  clientName: string;
  title: string;
}

interface UseOccupiedSlotsOptions {
  coachId: string;
  startDate: Date;
  endDate: Date;
  enabled?: boolean;
}

export function useOccupiedSlots({
  coachId,
  startDate,
  endDate,
  enabled = true,
}: UseOccupiedSlotsOptions) {
  return useQuery({
    queryKey: [
      "occupied-slots",
      coachId,
      format(startDate, "yyyy-MM-dd"),
      format(endDate, "yyyy-MM-dd"),
    ],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from("events")
        .select("id, start_at, end_at, title, clients!events_client_id_fkey(first_name, last_name)")
        .eq("coach_id", coachId)
        .gte("start_at", startDate.toISOString())
        .lte("end_at", endDate.toISOString())
        .order("start_at");

      if (error) throw error;

      return (events || []).map((e) => ({
        id: e.id,
        start: e.start_at,
        end: e.end_at,
        title: e.title,
        clientName: e.clients
          ? `${e.clients.first_name} ${e.clients.last_name}`.trim()
          : "Cliente sconosciuto",
      })) as OccupiedSlot[];
    },
    enabled,
  });
}
