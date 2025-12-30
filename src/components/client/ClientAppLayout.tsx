import { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useCurrentClient } from "@/features/client/hooks/useCurrentClient";
import ClientTopbar from "./ClientTopbar";
import ClientBottomNav from "./ClientBottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const ClientAppLayout = () => {
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

  // Loading state - show spinner while checking auth
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect immediately (render-time protection)
  if (!user) {
    return <Navigate to="/client/auth" replace />;
  }

  // Authenticated - render the protected content
  return <AuthenticatedClientLayout userId={user.id} />;
};

/**
 * Inner component that only mounts when user is authenticated.
 * This ensures no data queries run before authentication is confirmed.
 */
function AuthenticatedClientLayout({ userId }: { userId: string }) {
  const { data: client, isLoading: clientLoading } = useCurrentClient();

  // Loading client data
  if (clientLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento profilo...</p>
        </div>
      </div>
    );
  }

  // Authenticated but no linked client profile
  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
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

  // Fully authenticated and linked - render the app
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ClientTopbar />
      
      <main className="flex-1 px-4 py-4 pb-20">
        <Outlet />
      </main>
      
      <ClientBottomNav />
    </div>
  );
}

export default ClientAppLayout;
