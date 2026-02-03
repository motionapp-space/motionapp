import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentClientWithAuth } from "@/features/client/hooks/useCurrentClientWithAuth";
import { ClientAuthProvider } from "@/contexts/ClientAuthContext";
import { useUserRoles } from "@/features/auth/hooks/useUserRoles";
import ClientTopbar from "./ClientTopbar";
import ClientBottomNav from "./ClientBottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { FullScreenLoader, FullScreenError } from "@/components/common/FullScreenLoader";

/**
 * Protected layout for client app routes
 * Uses centralized auth context - no redundant getSession() calls
 */
const ClientAppLayout = () => {
  const { user, userId, isLoading: authLoading } = useAuth();

  // Loading auth
  if (authLoading) {
    return <FullScreenLoader message="Caricamento..." />;
  }

  // Not authenticated - redirect immediately (render-time protection)
  if (!userId) {
    return <Navigate to="/client/auth" replace />;
  }

  // Authenticated - render the protected content
  return <AuthenticatedClientLayout userId={userId} />;
};

/**
 * Inner component that only mounts when user is authenticated.
 * This ensures no data queries run before authentication is confirmed.
 */
function AuthenticatedClientLayout({ userId }: { userId: string }) {
  const { data: client, isLoading: clientLoading, isError: clientError, refetch: refetchClient } = useCurrentClientWithAuth(userId);
  const { isClient, isLoading: rolesLoading, isError: rolesError, refetch: refetchRoles } = useUserRoles();

  // Loading client data or roles
  if (clientLoading || rolesLoading) {
    return <FullScreenLoader message="Caricamento profilo..." />;
  }

  // Error fetching roles - show retry
  if (rolesError) {
    return (
      <FullScreenError
        title="Impossibile verificare i permessi"
        message="Si è verificato un errore durante la verifica dei permessi. Controlla la connessione e riprova."
        onRetry={() => refetchRoles()}
      />
    );
  }

  // Error fetching client - show retry
  if (clientError) {
    return (
      <FullScreenError
        title="Impossibile caricare il profilo"
        message="Si è verificato un errore durante il caricamento del profilo. Controlla la connessione e riprova."
        onRetry={() => refetchClient()}
      />
    );
  }

  // Not a client - redirect to client auth
  if (!isClient) {
    return <Navigate to="/client/auth" replace />;
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
    <ClientAuthProvider userId={userId}>
      <div className="flex flex-col min-h-screen bg-background">
        <ClientTopbar />
        
        <main className="flex-1 px-4 py-4 pb-20">
          <Outlet />
        </main>
        
        <ClientBottomNav />
      </div>
    </ClientAuthProvider>
  );
}

export default ClientAppLayout;
