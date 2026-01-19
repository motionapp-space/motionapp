import { UserPlus } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface ClientsEmptyOnboardingProps {
  onCreateClient: () => void;
}

export function ClientsEmptyOnboarding({ onCreateClient }: ClientsEmptyOnboardingProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <EmptyState
        icon={UserPlus}
        title="Benvenuto in Motion"
        description="Inizia aggiungendo il tuo primo cliente"
        action={{
          label: "Crea il tuo primo cliente",
          onClick: onCreateClient
        }}
      />
    </div>
  );
}
