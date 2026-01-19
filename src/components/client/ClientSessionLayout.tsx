/**
 * ClientSessionLayout - Immersive layout for live workout sessions
 * 
 * This layout replicates the auth logic from ClientAppLayout but:
 * - NO ClientTopbar
 * - NO ClientBottomNav  
 * - NO padding on main content
 * - Root is h-[100dvh] overflow-hidden for immersive experience
 */

import { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useCurrentClientWithAuth } from "@/features/client/hooks/useCurrentClientWithAuth";
import { ClientAuthProvider } from "@/contexts/ClientAuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const ClientSessionLayout = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Auth check - runs before any data fetching
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Loading state - immersive centered spinner
  if (authLoading) {
    return (
      <div className="h-[100dvh] overflow-hidden bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect immediately
  if (!user) {
    return <Navigate to="/client/auth" replace />;
  }

  // Authenticated - render the protected content
  return <AuthenticatedSessionLayout userId={user.id} />;
};

/**
 * Inner component that only mounts when user is authenticated.
 * Immersive layout with no chrome (topbar/bottom nav).
 */
function AuthenticatedSessionLayout({ userId }: { userId: string }) {
  const { data: client, isLoading: clientLoading } = useCurrentClientWithAuth(userId);

  // Loading client data
  if (clientLoading) {
    return (
      <div className="h-[100dvh] overflow-hidden bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento profilo...</p>
        </div>
      </div>
    );
  }

  // Authenticated but no linked client profile
  if (!client) {
    return (
      <div className="h-[100dvh] overflow-hidden bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-amber-500/10 p-3">
                <AlertCircle className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Account non collegato</h2>
                <p className="text-sm text-muted-foreground">
                  Il tuo account non è ancora collegato a un profilo cliente.
                  Contatta il tuo personal trainer per completare la configurazione.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fully authenticated and linked - render immersive layout
  // Root: h-[100dvh] overflow-hidden - this is the viewport owner
  // Inner: h-full flex-col min-h-0 - allows child to fill and scroll internally
  return (
    <ClientAuthProvider userId={userId}>
      <div className="h-[100dvh] overflow-hidden bg-background">
        <div className="h-full flex flex-col min-h-0">
          <Outlet />
        </div>
      </div>
    </ClientAuthProvider>
  );
}

export default ClientSessionLayout;
