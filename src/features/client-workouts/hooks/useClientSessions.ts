import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getClientSessions } from "../api/client-sessions.api";
import { useEffect, useState } from "react";

export function useClientSessions() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  return useQuery({
    queryKey: ["client-sessions", userId],
    queryFn: () => getClientSessions(),
    enabled: !!userId,
    staleTime: 60_000,
  });
}
