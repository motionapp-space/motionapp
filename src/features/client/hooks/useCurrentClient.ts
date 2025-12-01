import { useQuery } from "@tanstack/react-query";
import { getCurrentClient } from "../api/client.api";

/**
 * Hook React Query per ottenere il client associato all'utente autenticato corrente
 */
export function useCurrentClient() {
  return useQuery({
    queryKey: ["current-client"],
    queryFn: getCurrentClient,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minuti
  });
}
