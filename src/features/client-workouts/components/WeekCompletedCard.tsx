import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WeekCompletedCardProps {
  onViewPlan: () => void;
  onGoHistory: () => void;
}

export function WeekCompletedCard({ onViewPlan, onGoHistory }: WeekCompletedCardProps) {
  return (
    <Card className="shadow-sm rounded-2xl">
      <CardContent className="p-5">
        <p className="text-base font-medium text-foreground">
          Vuoi continuare così?
        </p>
        
        <div className="mt-3 flex gap-3">
          <Button 
            variant="default" 
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
  );
}
