import { useEffect } from "react";
import { useActiveSessionQuery } from "./useActiveSessionQuery";
import { useSessionStore } from "@/stores/useSessionStore";

export function useSessionBridge(userId?: string) {
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const { data, isFetching, error } = useActiveSessionQuery({ 
    userId, 
    enabled: !!userId 
  });

  useEffect(() => {
    setActiveSession(data ?? null);
  }, [data, setActiveSession]);

  return { isFetching, error };
}
