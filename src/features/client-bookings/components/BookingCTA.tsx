import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";

interface BookingCTAProps {
  enabled: boolean;
  onBook: () => void;
  isLoading?: boolean;
}

export function BookingCTA({ enabled, onBook, isLoading }: BookingCTAProps) {
  if (!enabled) {
    return (
      <p className="text-sm text-muted-foreground text-center px-4 py-2">
        Le prenotazioni self-service non sono abilitate dal coach.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button 
        className="w-full h-12" 
        size="lg"
        onClick={onBook}
        disabled={isLoading}
      >
        <CalendarPlus className="h-4 w-4 mr-2" />
        Prenota appuntamento
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Il coach confermerà l'orario prima dell'appuntamento.
      </p>
    </div>
  );
}
