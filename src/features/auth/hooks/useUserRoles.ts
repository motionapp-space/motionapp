import { useQuery } from "@tanstack/react-query";
import { getCurrentUserRoles } from "../api/roles.api";

/**
 * Hook to fetch and check user roles
 * Exposes isAdmin, isCoach, isClient flags for convenience
 */
export function useUserRoles() {
  const query = useQuery({
    queryKey: ["userRoles"],
    queryFn: getCurrentUserRoles,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
  
  const roles = query.data || [];
  
  return {
    roles,
    isAdmin: roles.includes('admin'),
    isCoach: roles.includes('coach'),
    isClient: roles.includes('client'),
    isLoading: query.isLoading,
  };
}
