import { useQuery } from "@tanstack/react-query";
import { getActiveSession } from "@/features/sessions/api/sessions.api";
import { usePageVisible } from "./usePageVisible";

interface UseActiveSessionQueryOptions {
  userId?: string;
  enabled?: boolean;
}

export function useActiveSessionQuery(opts: UseActiveSessionQueryOptions = {}) {
  const { userId, enabled = true } = opts;
  const visible = usePageVisible();

  return useQuery({
    queryKey: ["activeSession", userId],
    enabled: enabled && !!userId,
    queryFn: () => getActiveSession(userId),
    staleTime: 0,
    refetchInterval: visible ? 30_000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
