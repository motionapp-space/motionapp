import { Package } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface PackageEmptyStateProps {
  onCreatePackage: () => void;
}

export function PackageEmptyState({ onCreatePackage }: PackageEmptyStateProps) {
  return (
    <EmptyState
      icon={Package}
      title="Non ci sono pacchetti attivi"
      description="Non ci sono pacchetti attivi per questo cliente. Crea un nuovo pacchetto o pianifica una lezione (verrà creato automaticamente un pacchetto singolo)."
      action={{
        label: "Nuovo pacchetto",
        onClick: onCreatePackage
      }}
    />
  );
}
