import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/types/user";

/**
 * Fetches all roles for the current authenticated user
 * Returns empty array if not authenticated or on error
 */
export async function getCurrentUserRoles(): Promise<AppRole[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
  
  return data?.map(r => r.role as AppRole) || [];
}
