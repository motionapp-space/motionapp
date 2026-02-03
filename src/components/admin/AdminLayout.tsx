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

  // Still checking auth status or roles
  if (authLoading || rolesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Verifica autorizzazioni...</p>
        </div>
      </div>
    );
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
