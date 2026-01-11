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
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-3">
        Azioni rapide
      </p>

      <Card className="shadow-sm rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground">
                🎉 Ottimo lavoro
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Vuoi rivedere il piano o controllare lo storico?
              </p>

              {/* CTAs - side by side */}
              <div className="mt-4 flex gap-3 flex-col sm:flex-row">
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
