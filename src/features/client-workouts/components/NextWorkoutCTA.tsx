import { Dumbbell, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface NextWorkoutCTAProps {
  title: string;
  exercisesCount: number;
  estimatedMinutes?: number;
  status: "today" | "todo";
  onStart: () => void;
  onChangeDay: () => void;
  onViewDetail: () => void;
  startDisabled?: boolean;
  startDisabledReason?: string;
  isLoading?: boolean;
}

export function NextWorkoutCTA({
  title,
  exercisesCount,
  estimatedMinutes = 45,
  status,
  onStart,
  onChangeDay,
  onViewDetail,
  startDisabled = true,
  startDisabledReason = "Funzionalità in arrivo",
  isLoading,
}: NextWorkoutCTAProps) {
  if (isLoading) {
    return (
      <section>
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-3">
          Prossimo allenamento
        </p>
        <Card className="shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="h-10 w-full mt-4" />
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-3">
        Prossimo allenamento
      </p>
      
      <Card className="shadow-sm rounded-2xl">
        <CardContent className="p-5">
          {/* Card header with info */}
          <button 
            onClick={onViewDetail}
            className="flex items-start gap-3 w-full text-left"
          >
            {/* Icon */}
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Dumbbell className="w-5 h-5 text-primary" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground truncate">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {exercisesCount} esercizi · ~{estimatedMinutes} min
              </p>
            </div>

            {/* Badge + Chevron */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={status === "today" ? "default" : "secondary"}>
                {status === "today" ? "Oggi" : "Da fare"}
              </Badge>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>

          {/* Primary CTA */}
          <Button 
            className="w-full mt-4" 
            size="lg"
            onClick={onStart}
            disabled={startDisabled}
          >
            ▶️ Inizia allenamento
          </Button>
          
          {/* Disabled helper text */}
          {startDisabled && startDisabledReason && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              {startDisabledReason}
            </p>
          )}

          {/* Secondary CTA - now a ghost button for visual weight */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onChangeDay}
            className="w-full mt-3"
          >
            Cambia giorno
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
