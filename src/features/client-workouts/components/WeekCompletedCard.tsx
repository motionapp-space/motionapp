import { CheckCircle2 } from "lucide-react";
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
        Azioni rapide
      </p>

      <Card className="shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-foreground">
                🎉 Ottimo lavoro
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Vuoi rivedere il piano o controllare lo storico?
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onViewPlan}
                >
                  Rivedi piano
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onGoHistory}
                >
                  Vai allo storico
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
