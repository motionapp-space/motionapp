import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/features/auth/hooks/useUserRoles";
import { FullScreenLoader, FullScreenError } from "@/components/common/FullScreenLoader";

/**
 * Protected layout for admin routes
 * Uses centralized auth context - no redundant getSession() calls
 * - Verifies authentication via context
 * - Verifies admin role via useUserRoles
 * - Shows loading during verification
 * - Shows error with retry on failure
 * - Redirects to / if not admin
 */
export default function AdminLayout() {
  const { userId, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: rolesLoading, isError: rolesError, refetch } = useUserRoles();

  // Loading state - show spinner
  if (authLoading || rolesLoading) {
    return <FullScreenLoader message="Verifica permessi..." />;
  }

  // Not authenticated - redirect to auth
  if (!userId) {
    return <Navigate to="/auth" replace />;
  }

  // Error fetching roles - show retry option
  if (rolesError) {
    return (
      <FullScreenError
        title="Impossibile verificare i permessi"
        message="Si è verificato un errore durante la verifica dei permessi. Controlla la connessione e riprova."
        onRetry={() => refetch()}
      />
    );
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
