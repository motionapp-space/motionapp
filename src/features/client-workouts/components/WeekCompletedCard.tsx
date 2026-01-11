import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WeekCompletedCardProps {
  onViewPlan: () => void;
  onGoHistory: () => void;
}

export function WeekCompletedCard({ onViewPlan, onGoHistory }: WeekCompletedCardProps) {
  return (
    <section>
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
        Prossimo allenamento
      </p>

      <Card className="shadow-sm bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
        <CardContent className="p-6 text-center">
          {/* Icon */}
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-7 h-7 text-green-600 dark:text-green-400" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Settimana completata!
          </h3>

          {/* Subtitle */}
          <p className="text-sm text-muted-foreground mb-6">
            Ottimo lavoro, il tuo coach vedrà i tuoi progressi.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onViewPlan}
            >
              Rivedi piano
            </Button>
            <Button 
              variant="ghost" 
              className="flex-1"
              onClick={onGoHistory}
            >
              Vai allo storico
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
