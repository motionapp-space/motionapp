import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface PackageTabProps {
  clientId: string;
}

export function PackageTab({ clientId }: PackageTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: packages, isLoading, error } = useClientPackages(clientId);
  const createMutation = useCreatePackage();
  const archiveMutation = useArchivePackage();
  const suspensionMutation = useToggleSuspension();
  const duplicateMutation = useDuplicatePackage();

  const activePackage = packages?.find(p => p.usage_status === 'active');
  const hasActivePackage = !!activePackage;

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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pacchetti sessioni</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestisci i pacchetti di sessioni del cliente
          </p>
        </div>
        <Button 
          onClick={() => setDialogOpen(true)}
          disabled={hasActivePackage}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuovo pacchetto
        </Button>
      </div>

      {hasActivePackage && (
        <Alert>
          <AlertDescription>
            È consentito un solo pacchetto attivo per cliente. 
            Completa o archivia il pacchetto attuale per crearne uno nuovo.
          </AlertDescription>
        </Alert>
      )}

      {/* Active Packages */}
      {activePackages.length === 0 && completedPackages.length === 0 ? (
        <PackageEmptyState onCreatePackage={() => setDialogOpen(true)} />
      ) : (
        <>
          {activePackages.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Pacchetti attivi</h3>
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
            <div className="space-y-4">
              <h3 className="font-semibold text-muted-foreground">Storico e archiviati</h3>
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
