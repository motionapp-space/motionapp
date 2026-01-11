import { Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WeekCompletedCardProps {
  onStartSession: () => void;
  onViewPlan: () => void;
  onGoHistory: () => void;
}

export function WeekCompletedCard({ onStartSession, onViewPlan, onGoHistory }: WeekCompletedCardProps) {
  return (
    <div className="space-y-3">
      {/* Section header */}
      <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Prossima azione
      </h3>
      
      <Card className="shadow-sm rounded-2xl">
        <CardContent className="p-5">
          {/* Primary CTA - always visible */}
          <Button 
            onClick={onStartSession}
            className="w-full"
            size="lg"
          >
            <Play className="w-4 h-4 mr-2" />
            Inizia una nuova sessione
          </Button>
          
          {/* Secondary actions */}
          <div className="mt-3 flex gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onViewPlan}
              className="flex-1"
            >
              Rivedi il piano
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onGoHistory}
              className="flex-1"
            >
              Vedi storico
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
