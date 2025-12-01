import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";

/**
 * Recupera il client associato all'utente autenticato corrente
 * tramite il campo auth_user_id nella tabella clients
 */
export async function getCurrentClient(): Promise<Client | null> {
  try {
    // Ottieni l'utente corrente da Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null;
    }

    // Cerca il client con auth_user_id = user.id
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("auth_user_id", user.id)
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
