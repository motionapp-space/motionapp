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

      const { data, error } = await supabase
        .from("training_sessions")
        .select("*")
        .eq("event_id", eventId)
        .eq("coach_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as TrainingSession | null;
    },
    enabled: !!eventId,
  });
}
