import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getClientBookingSettings } from "../api/client-bookings.api";
import { useEffect, useState } from "react";

export function useClientBookingSettings() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  return useQuery({
    queryKey: ["client-booking-settings", userId],
    queryFn: getClientBookingSettings,
    enabled: !!userId,
    staleTime: 60_000,
  });
}
