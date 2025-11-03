import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Info, AlertTriangle } from "lucide-react";
import { PackageCard } from "./PackageCard";
import { PackageDialog } from "./PackageDialog";
import { PackageEmptyState } from "./PackageEmptyState";
import { useClientPackages } from "../hooks/useClientPackages";
import { useCreatePackage } from "../hooks/useCreatePackage";
import { 
  useArchivePackage, 
  useToggleSuspension, 
  useDuplicatePackage 
} from "../hooks/usePackageActions";
import type { CreatePackageInput } from "../types";
import { useClientsQuery } from "@/features/clients/hooks/useClientsQuery";

interface PackageTabProps {
  clientId: string;
}

export function PackageTab({ clientId }: PackageTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: packages, isLoading, error } = useClientPackages(clientId);
  const { data: clients } = useClientsQuery({});
  const createMutation = useCreatePackage();
  const archiveMutation = useArchivePackage();
  const suspensionMutation = useToggleSuspension();
  const duplicateMutation = useDuplicatePackage();

  const client = clients?.items.find(c => c.id === clientId);
  const activePackage = packages?.find(p => p.usage_status === 'active');
  const hasActivePackage = !!activePackage;
  
  // Calculate total active sessions
  const totalActiveSessions = activePackage ? activePackage.total_sessions : 0;

  const handleCreate = (data: CreatePackageInput) => {
    createMutation.mutate(data, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Errore nel caricamento dei pacchetti: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  const activePackages = packages?.filter(p => 
    p.usage_status === 'active' || p.usage_status === 'suspended'
  ) || [];
  
  const completedPackages = packages?.filter(p => 
    p.usage_status === 'completed' || p.usage_status === 'archived'
  ) || [];

  return (
    <div className="space-y-8 p-6">
      {/* Client Header */}
      {client && (
        <div className="flex items-start justify-between pb-6 border-b">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {client.last_name} {client.first_name}
              </h1>
              <Badge 
                variant={client.status === 'ATTIVO' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {client.status.toLowerCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Cliente {client.status.toLowerCase()} • {totalActiveSessions > 0 ? `${totalActiveSessions} lezioni in corso` : 'Nessuna lezione in corso'}
            </p>
          </div>
        </div>
      )}

      {/* Info Alert */}
      {hasActivePackage && (
        <Alert className="bg-info/10 border-info rounded-2xl">
          <Info className="h-4 w-4 text-info" />
          <AlertDescription className="text-sm">
            Puoi mantenere un solo pacchetto attivo per cliente. Completa o archivia il pacchetto corrente per crearne uno nuovo.
          </AlertDescription>
        </Alert>
      )}

      {/* Section Header with Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Pacchetti attivi</h2>
        <Button 
          onClick={() => setDialogOpen(true)}
          disabled={hasActivePackage}
          className="rounded-2xl px-4 py-2 font-semibold"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuovo pacchetto
        </Button>
      </div>

      {/* Active Packages */}
      {activePackages.length === 0 && completedPackages.length === 0 ? (
        <PackageEmptyState onCreatePackage={() => setDialogOpen(true)} />
      ) : (
        <>
          {activePackages.length > 0 && (
            <div className="space-y-4">
              {activePackages.map(pkg => (
                <PackageCard
                  key={pkg.package_id}
                  package={pkg}
                  onViewDetails={() => {/* TODO: implement details drawer */}}
                  onToggleSuspension={() => suspensionMutation.mutate(pkg.package_id)}
                  onArchive={() => archiveMutation.mutate(pkg.package_id)}
                  onDuplicate={() => duplicateMutation.mutate(pkg.package_id)}
                />
              ))}
            </div>
          )}

          {/* History */}
          {completedPackages.length > 0 && (
            <div className="space-y-4 mt-12">
              <h3 className="text-xl font-semibold text-muted-foreground">Storico e archiviati</h3>
              <div className="space-y-4 opacity-75">
                {completedPackages.map(pkg => (
                  <PackageCard
                    key={pkg.package_id}
                    package={pkg}
                    onViewDetails={() => {/* TODO: implement details drawer */}}
                    onToggleSuspension={() => {}}
                    onArchive={() => {}}
                    onDuplicate={() => duplicateMutation.mutate(pkg.package_id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <PackageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clientId={clientId}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
