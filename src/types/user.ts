/**
 * Unified Identity Types
 * Centralized user identity with role-based access
 */

export type AppRole = 'coach' | 'client' | 'admin';

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface UserWithRole extends User {
  role: AppRole;
}

/**
 * Helper to get full name from User
 */
export function getUserFullName(user: User | null): string {
  if (!user) return '';
  const parts = [user.first_name, user.last_name].filter(Boolean);
  return parts.join(' ') || user.email;
}

/**
 * Helper to get initials from User
 */
export function getUserInitials(user: User | null): string {
  if (!user) return 'U';
  if (user.first_name) {
    const first = user.first_name.charAt(0).toUpperCase();
    const last = user.last_name?.charAt(0).toUpperCase() || '';
    return first + last;
  }
  return user.email.charAt(0).toUpperCase();
}
