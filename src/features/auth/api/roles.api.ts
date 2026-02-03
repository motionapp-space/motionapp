import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/types/user";

/**
 * Fetches all roles for a specific user ID
 * Returns empty array on error
 */
export async function fetchRolesForUser(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
  
  return data?.map(r => r.role as AppRole) || [];
}

/**
 * @deprecated Use fetchRolesForUser with userId from context instead
 * Fetches all roles for the current authenticated user
 * Returns empty array if not authenticated or on error
 */
export async function getCurrentUserRoles(): Promise<AppRole[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  return fetchRolesForUser(user.id);
}
