import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WeekCompletedCardProps {
  onStartSession: () => void;
}

export function WeekCompletedCard({ onStartSession }: WeekCompletedCardProps) {
  return (
    <div className="space-y-2">
      {/* Section header */}
      <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Prossima azione
      </h3>
      
      {/* Primary CTA - compact, no card wrapper */}
      <Button 
        onClick={onStartSession}
        className="w-full"
        size="lg"
      >
        <Play className="w-4 h-4 mr-2" />
        Inizia una nuova sessione
      </Button>
    </div>
  );
}
