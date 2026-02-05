import { Package } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface PackageEmptyStateProps {
  onCreatePackage: () => void;
}

export function PackageEmptyState({ onCreatePackage }: PackageEmptyStateProps) {
  return (
    <EmptyState
      icon={Package}
      title="Nessun pacchetto attivo"
      description="Crea un pacchetto per gestire le lezioni del cliente e il conteggio automatico degli appuntamenti."
      action={{
        label: "Nuovo pacchetto",
        onClick: onCreatePackage
      }}
    />
  );
}
