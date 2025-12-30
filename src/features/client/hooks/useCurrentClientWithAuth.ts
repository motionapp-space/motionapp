import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";

/**
 * Hook per ottenere il client associato a un userId specifico.
 * Usato nel layout prima che ClientAuthProvider esista.
 */
export function useCurrentClientWithAuth(userId: string) {
  return useQuery({
    queryKey: ["current-client", userId],
    queryFn: async (): Promise<Client | null> => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching current client:", error);
        return null;
      }
      return data;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}
