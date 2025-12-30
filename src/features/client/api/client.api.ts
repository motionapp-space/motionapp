import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";

/**
 * Recupera il client associato all'utente autenticato corrente
 * 
 * Unified Identity pattern: cerca tramite user_id (FK a users.id)
 */
export async function getCurrentClient(): Promise<Client | null> {
  try {
    // Ottieni l'utente corrente da Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null;
    }

    // Fetch client via user_id (Unified Identity)
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

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
