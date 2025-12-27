import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TrainingSession } from "../types";

export function useSessionByEventId(eventId: string | undefined) {
  return useQuery({
    queryKey: ["session-by-event", eventId],
    queryFn: async () => {
      if (!eventId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Query via coach_clients to ensure coach owns the session
      const { data, error } = await supabase
        .from("training_sessions")
        .select("*, coach_clients!inner(coach_id)")
        .eq("event_id", eventId)
        .eq("coach_clients.coach_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as TrainingSession | null;
    },
    enabled: !!eventId,
  });
}
