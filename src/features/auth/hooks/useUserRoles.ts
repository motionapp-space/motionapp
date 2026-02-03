import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchRolesForUser } from "../api/roles.api";

/**
 * Hook to fetch and check user roles
 * Uses centralized auth context - no redundant getUser() calls
 * Exposes isAdmin, isCoach, isClient flags for convenience
 */
export function useUserRoles() {
  const { userId, isLoading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ["userRoles", userId],
    queryFn: () => fetchRolesForUser(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
  
  const roles = query.data || [];
  
  return {
    roles,
    isAdmin: roles.includes('admin'),
    isCoach: roles.includes('coach'),
    isClient: roles.includes('client'),
    isLoading: authLoading || query.isLoading,
  };
}
