import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getClientAppointments } from "../api/client-bookings.api";
import { useEffect, useState } from "react";

export function useClientAppointmentsView() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  return useQuery({
    queryKey: ["client-appointments-view", userId],
    queryFn: getClientAppointments,
    enabled: !!userId,
    staleTime: 30_000,
  });
}
