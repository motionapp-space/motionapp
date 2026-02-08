import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Dumbbell, PartyPopper } from "lucide-react";
import type { Day } from "@/types/plan";

interface NextWorkoutCardProps {
  day: Day | null;
  exerciseCount: number;
  allCompleted: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export function NextWorkoutCard({ 
  day, 
  exerciseCount, 
  allCompleted,
  isLoading, 
  onClick 
}: NextWorkoutCardProps) {
  if (isLoading) {
    return <Skeleton className="h-20 w-full rounded-xl" />;
  }

  // All workouts completed this week
  if (allCompleted) {
    return (
      <Card className="shadow-sm bg-primary/5 border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <PartyPopper className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Settimana completata!</p>
              <p className="text-[15px] leading-6 text-muted-foreground mt-0.5">
                Ottimo lavoro, hai completato tutti gli allenamenti
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No plan or no days
  if (!day) {
    return null;
  }

  return (
    <Card 
      className="shadow-sm border-l-4 border-l-primary hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {day.title}
            </p>
            <p className="text-[15px] leading-6 text-muted-foreground mt-0.5">
              {exerciseCount} esercizi
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
