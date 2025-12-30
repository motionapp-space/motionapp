import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";

/**
 * Recupera il client associato all'utente autenticato corrente
 * 
 * Unified Identity pattern: cerca tramite user_id (FK a users.id)
 * Fallback: cerca tramite auth_user_id per retrocompatibilità
 */
export async function getCurrentClient(): Promise<Client | null> {
  try {
    // Ottieni l'utente corrente da Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null;
    }

    // Try user_id first (Unified Identity)
    let { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fallback to auth_user_id for backward compatibility
    if (!data && !error) {
      const result = await supabase
        .from("clients")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Error fetching current client:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error in getCurrentClient:", error);
    return null;
  }
}
