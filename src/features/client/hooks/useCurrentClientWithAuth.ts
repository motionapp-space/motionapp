import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";

/**
 * Hook per ottenere il client associato a un userId specifico.
 * Usato nel layout prima che ClientAuthProvider esista.
 * 
 * Unified Identity pattern: cerca tramite user_id (FK a users.id)
 * Fallback: cerca tramite auth_user_id per retrocompatibilità
 */
export function useCurrentClientWithAuth(userId: string) {
  return useQuery({
    queryKey: ["current-client", userId],
    queryFn: async (): Promise<Client | null> => {
      // Try user_id first (Unified Identity)
      let { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      // Fallback to auth_user_id for backward compatibility
      if (!data && !error) {
        const result = await supabase
          .from("clients")
          .select("*")
          .eq("auth_user_id", userId)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }

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
