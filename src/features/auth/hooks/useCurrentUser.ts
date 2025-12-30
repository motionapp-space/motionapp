import { useQuery } from "@tanstack/react-query";
import { getCurrentUserWithRole, getCurrentUserRole } from "../api/users.api";
import type { UserWithRole, AppRole } from "@/types/user";

/**
 * Hook to fetch the current authenticated user with their role
 */
export function useCurrentUser() {
  return useQuery<UserWithRole | null>({
    queryKey: ["currentUser"],
    queryFn: getCurrentUserWithRole,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
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
