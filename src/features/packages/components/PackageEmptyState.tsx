import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

interface PackageEmptyStateProps {
  onCreatePackage: () => void;
}

export function PackageEmptyState({ onCreatePackage }: PackageEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
      <div className="rounded-full bg-muted p-6">
        <Package className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Non ci sono pacchetti attivi</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Non ci sono pacchetti attivi per questo cliente. 
          Crea un nuovo pacchetto o pianifica una lezione 
          (verrà creato automaticamente un pacchetto singolo).
        </p>
      </div>

      <Button onClick={onCreatePackage}>
        Nuovo pacchetto
      </Button>
    </div>
  );
}
