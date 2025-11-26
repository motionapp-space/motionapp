import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface ClientViewBannerProps {
  onBackToCoach: () => void;
}

export function ClientViewBanner({ onBackToCoach }: ClientViewBannerProps) {
  return (
    <Alert className="border-blue-200 bg-blue-50/50 mb-4 [&>svg]:top-[18px]">
      <Eye className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-base font-semibold text-foreground">
        Stai simulando la vista cliente
      </AlertTitle>
      <AlertDescription className="text-sm text-muted-foreground">
        Vedi il calendario come un cliente che prova a prenotare online. In questa modalità non puoi creare o modificare appuntamenti.
      </AlertDescription>
      <Button
        variant="link"
        size="sm"
        onClick={onBackToCoach}
        className="h-auto p-0 text-sm text-primary hover:text-primary/80 mt-1"
      >
        ← Torna alla vista coach
      </Button>
    </Alert>
  );
}
