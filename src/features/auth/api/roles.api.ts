import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/types/user";

/**
 * Error thrown when role fetching fails
 */
export class RolesFetchError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'RolesFetchError';
  }
}

/**
 * Fetches all roles for a specific user ID
 * Returns empty array on error (legacy behavior for compatibility)
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
 * Strict version that throws on error - use with React Query for proper error handling
 * This allows distinguishing "no roles" from "error fetching roles"
 */
export async function fetchRolesForUserStrict(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) {
    throw new RolesFetchError('Failed to fetch user roles', error);
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
