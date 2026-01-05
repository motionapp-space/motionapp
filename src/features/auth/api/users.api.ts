import { supabase } from "@/integrations/supabase/client";
import type { User, UserWithRole, AppRole } from "@/types/user";

/**
 * Fetches the current authenticated user with their role
 * Returns null if not authenticated or no user record found
 */
export async function getCurrentUserWithRole(): Promise<UserWithRole | null> {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return null;
    }

    // Fetch user profile from users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    // If no profile exists yet (edge case), return null
    if (!profile) {
      console.warn('No user profile found for auth user:', authUser.id);
      return null;
    }

    // Fetch all roles from user_roles table (user may have multiple roles)
    const { data: rolesData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authUser.id);

    if (roleError) {
      console.error('Error fetching user roles:', roleError);
    }

    // Prioritize 'coach' role if present, otherwise 'client', then fallback
    const roles = rolesData?.map(r => r.role as AppRole) || [];
    const role: AppRole = roles.includes('coach') 
      ? 'coach' 
      : roles.includes('client') 
        ? 'client' 
        : 'client';

    return {
      id: profile.id,
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      role,
    };
  } catch (error) {
    console.error('Unexpected error in getCurrentUserWithRole:', error);
    return null;
  }
}

/**
 * Fetches just the role for the current authenticated user
 * Useful for quick role checks without loading full profile
 */
export async function getCurrentUserRole(): Promise<AppRole | null> {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return null;
    }

    // Fetch all roles (user may have multiple roles)
    const { data: rolesData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authUser.id);

    if (roleError) {
      console.error('Error fetching user roles:', roleError);
      return null;
    }

    // Prioritize 'coach' role if present
    const roles = rolesData?.map(r => r.role as AppRole) || [];
    return roles.includes('coach') 
      ? 'coach' 
      : roles[0] || null;
  } catch (error) {
    console.error('Unexpected error in getCurrentUserRole:', error);
    return null;
  }
}

/**
 * Fetches user profile by ID (for coaches viewing client profiles)
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getUserById:', error);
    return null;
  }
}
