import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserProfileWithRole, getCurrentUserRole } from "../api/users.api";
import type { UserWithRole, AppRole } from "@/types/user";

/**
 * Hook to fetch the current authenticated user with their role
 * Uses centralized auth context - no redundant getUser() calls
 */
export function useCurrentUser() {
  const { userId, isLoading: authLoading } = useAuth();

  const query = useQuery<UserWithRole | null>({
    queryKey: ["currentUser", userId],
    queryFn: () => fetchUserProfileWithRole(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  return {
    ...query,
    isLoading: authLoading || query.isLoading,
  };
}

/**
 * Hook to fetch just the role for the current user
 * Lighter weight for quick role checks
 */
export function useCurrentUserRole() {
  return useQuery<AppRole | null>({
    queryKey: ["currentUserRole"],
    queryFn: getCurrentUserRole,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}
