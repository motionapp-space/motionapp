import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchRolesForUserStrict } from "../api/roles.api";

/**
 * Hook to fetch and check user roles
 * Uses centralized auth context - no redundant getUser() calls
 * Exposes isAdmin, isCoach, isClient flags for convenience
 * Now uses strict version to properly distinguish errors from empty roles
 */
export function useUserRoles() {
  const { userId, isLoading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ["userRoles", userId],
    queryFn: () => fetchRolesForUserStrict(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Retry twice before giving up
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });
  
  const roles = query.data || [];
  
  return {
    roles,
    isAdmin: roles.includes('admin'),
    isCoach: roles.includes('coach'),
    isClient: roles.includes('client'),
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
