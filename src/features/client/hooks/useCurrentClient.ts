import { useQuery } from "@tanstack/react-query";
import { getCurrentClient } from "../api/client.api";
import { useClientAuth } from "@/contexts/ClientAuthContext";

/**
 * Hook React Query per ottenere il client associato all'utente autenticato corrente.
 * Richiede di essere usato dentro ClientAuthProvider.
 */
export function useCurrentClient() {
  const { userId } = useClientAuth();

  return useQuery({
    queryKey: ["current-client", userId],
    queryFn: getCurrentClient,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}
