import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Info, AlertTriangle } from "lucide-react";
import { PackageCard } from "./PackageCard";
import { PackageDialog } from "./PackageDialog";
import { PackageEmptyState } from "./PackageEmptyState";
import { PackageDetailsDrawer } from "./PackageDetailsDrawer";
import { useClientPackages } from "../hooks/useClientPackages";
import { useCreatePackage } from "../hooks/useCreatePackage";
import { useUpdatePackage } from "../hooks/useUpdatePackage";
import { 
  useArchivePackage, 
  useToggleSuspension
} from "../hooks/usePackageActions";
import type { CreatePackageInput, PackagePaymentStatus, Package } from "../types";
import { useClientsQuery } from "@/features/clients/hooks/useClientsQuery";

interface PackageTabProps {
  clientId: string;
}

export function PackageTab({ clientId }: PackageTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [packageToArchive, setPackageToArchive] = useState<string | null>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  
  const { data: packages, isLoading, error } = useClientPackages(clientId);
  const { data: clients } = useClientsQuery({});
  const createMutation = useCreatePackage();
  const updateMutation = useUpdatePackage();
  const archiveMutation = useArchivePackage();
  const suspensionMutation = useToggleSuspension();

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

  const handleUpdatePaymentStatus = (packageId: string) => (
    newStatus: PackagePaymentStatus, 
    partialPaymentCents?: number,
    note?: string
  ) => {
    updateMutation.mutate({
      packageId,
      input: { 
        payment_status: newStatus,
        partial_payment_cents: partialPaymentCents 
      },
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
    <div className="space-y-6">
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
        <h3 className="text-lg font-semibold">Pacchetti attivi</h3>
        <Button 
          onClick={() => setDialogOpen(true)}
          disabled={hasActivePackage}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuovo pacchetto
        </Button>
      </div>

      {/* Active Packages */}
      {activePackages.length === 0 && completedPackages.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <PackageEmptyState onCreatePackage={() => setDialogOpen(true)} />
          </CardContent>
        </Card>
      ) : (
        <>
          {activePackages.length > 0 && (
            <div className="space-y-4">
              {activePackages.map(pkg => (
                <PackageCard
                  key={pkg.package_id}
                  package={pkg}
                  onViewDetails={() => {
                    setSelectedPackage(pkg);
                    setDetailsDrawerOpen(true);
                  }}
                  onUpdatePaymentStatus={handleUpdatePaymentStatus(pkg.package_id)}
                  onToggleSuspension={() => suspensionMutation.mutate(pkg.package_id)}
                  onArchive={() => {
                    setPackageToArchive(pkg.package_id);
                    setArchiveConfirmOpen(true);
                  }}
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
                    onViewDetails={() => {
                      setSelectedPackage(pkg);
                      setDetailsDrawerOpen(true);
                    }}
                    onUpdatePaymentStatus={handleUpdatePaymentStatus(pkg.package_id)}
                    onToggleSuspension={() => {}}
                    onArchive={() => {}}
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

      <AlertDialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiviare il pacchetto?</AlertDialogTitle>
            <AlertDialogDescription>
              Il pacchetto verrà archiviato e spostato nello storico. Questa azione è reversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (packageToArchive) {
                  archiveMutation.mutate(packageToArchive);
                  setArchiveConfirmOpen(false);
                  setPackageToArchive(null);
                }
              }}
            >
              Archivia
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PackageDetailsDrawer
        package={selectedPackage}
        open={detailsDrawerOpen}
        onOpenChange={setDetailsDrawerOpen}
      />
    </div>
  );
}
