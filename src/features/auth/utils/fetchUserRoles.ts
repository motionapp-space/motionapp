import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/types/user";

/**
 * Fetches all roles for a given user ID
 * Returns empty array if user not found or on error
 * Used for post-login redirect decisions
 */
export async function fetchUserRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) {
    console.error('[fetchUserRoles] Error fetching roles:', error);
    return [];
  }
  
  return data?.map(r => r.role as AppRole) || [];
}
