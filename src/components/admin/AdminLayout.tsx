import { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRoles } from "@/features/auth/hooks/useUserRoles";

/**
 * Protected layout for admin routes
 * - Verifies Supabase authentication
 * - Verifies admin role via useUserRoles
 * - Shows loading during verification
 * - Redirects to / if not admin
 */
export default function AdminLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { isAdmin, isLoading: rolesLoading } = useUserRoles();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Still checking auth status
  if (isAuthenticated === null || rolesLoading) {
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
  if (!isAuthenticated) {
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
