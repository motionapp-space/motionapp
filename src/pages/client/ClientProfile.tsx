import { LogOut, Mail, Phone, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientPageHeader } from "@/components/client/ClientPageHeader";
import { ClientEmptyState } from "@/components/client/ClientEmptyState";
import { useCurrentClient } from "@/features/client/hooks/useCurrentClient";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ClientProfile = () => {
  const navigate = useNavigate();
  const { data: client, isLoading } = useCurrentClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout effettuato");
    navigate("/client/auth");
  };

  if (isLoading) {
    return (
      <div className="px-5 py-5 space-y-6 pb-24">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="px-5 py-5 space-y-6 pb-24">
        <ClientPageHeader 
          title="Profilo" 
          description="Gestisci le tue informazioni personali"
        />
        <Card className="border-dashed shadow-sm">
          <CardContent className="p-5">
            <ClientEmptyState
              icon={User}
              title="Account non collegato"
              description="Il tuo account non è ancora collegato a un profilo cliente."
            />
          </CardContent>
        </Card>
        <Button 
          variant="outline" 
          className="w-full h-12 text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Esci
        </Button>
      </div>
    );
  }

  const initials = `${client.first_name?.charAt(0) || ''}${client.last_name?.charAt(0) || ''}`.toUpperCase();
  const fullName = `${client.first_name} ${client.last_name}`;

  return (
    <div className="px-5 py-5 space-y-6 pb-24">
      <ClientPageHeader 
        title="Profilo" 
        description="Gestisci le tue informazioni personali"
      />

      {/* Avatar Card */}
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-semibold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-foreground">{fullName}</p>
              {client.email && (
                <p className="text-sm text-muted-foreground truncate">{client.email}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="shadow-sm">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Informazioni
          </h3>
          
          <div className="space-y-3">
            {client.email && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground truncate">{client.email}</p>
                </div>
              </div>
            )}
            
            {client.phone && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Telefono</p>
                  <p className="text-sm font-medium text-foreground">{client.phone}</p>
                </div>
              </div>
            )}
            
            {!client.email && !client.phone && (
              <p className="text-sm text-muted-foreground">
                Nessuna informazione di contatto disponibile
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button 
        variant="outline" 
        className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/5"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Esci
      </Button>
    </div>
  );
};

export default ClientProfile;
