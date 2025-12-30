import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getClientActivePlan } from "../api/client-plans.api";
import { useEffect, useState } from "react";

export function useClientActivePlan() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  return useQuery({
    queryKey: ["client-active-plan", userId],
    queryFn: () => getClientActivePlan(),
    enabled: !!userId,
    staleTime: 60_000,
  });
}
