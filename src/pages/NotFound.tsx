import { useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const NotFound = () => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, [location.pathname]);

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Redirect authenticated users to dashboard, unauthenticated to auth
  return <Navigate to={isAuthenticated ? "/" : "/auth"} replace />;
};

export default NotFound;
