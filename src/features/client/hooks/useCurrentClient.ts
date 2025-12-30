import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentClient } from "../api/client.api";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

/**
 * Hook React Query per ottenere il client associato all'utente autenticato corrente.
 * Utilizza userId nella queryKey per isolare la cache per utente.
 */
export function useCurrentClient() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Ottieni l'userId corrente all'avvio
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });

    // Sottoscrivi ai cambiamenti di auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id ?? null;
      // Rimuovi cache precedente quando cambia utente
      queryClient.removeQueries({ queryKey: ["current-client"] });
      setUserId(newUserId);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return useQuery({
    queryKey: ["current-client", userId],
    queryFn: getCurrentClient,
    enabled: !!userId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minuti
  });
}
