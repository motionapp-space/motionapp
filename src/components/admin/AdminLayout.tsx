import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/features/auth/hooks/useUserRoles";

/**
 * Protected layout for admin routes
 * Uses centralized auth context - no redundant getSession() calls
 * - Verifies authentication via context
 * - Verifies admin role via useUserRoles
 * - Shows loading during verification
 * - Redirects to / if not admin
 */
export default function AdminLayout() {
  const { userId, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: rolesLoading } = useUserRoles();

  // Roles are pre-loaded in App.tsx, so loading should be false immediately
  // Keep as fallback only for edge cases
  if (authLoading || rolesLoading) {
    return null; // Return nothing - App.tsx spinner handles this
  }

  // Not authenticated - redirect to auth
  if (!userId) {
    return <Navigate to="/auth" replace />;
  }

  // Not admin - redirect to home
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Authorized - render admin content
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}
