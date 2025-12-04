import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Dumbbell } from "lucide-react";
import { ClientEmptyState } from "@/components/client/ClientEmptyState";
import type { ClientActivePlan } from "../api/client-plans.api";

interface ClientWorkoutTodayCardProps {
  plan: ClientActivePlan | null | undefined;
  isLoading: boolean;
}

export function ClientWorkoutTodayCard({ plan, isLoading }: ClientWorkoutTodayCardProps) {
  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find today's workout day based on day index
  const today = new Date();
  const dayOfWeek = today.getDay();
  const days = plan?.data?.days || [];
  const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const todayWorkout = days.length > 0 ? days[todayIndex % days.length] : null;

  if (!plan || !todayWorkout) {
    return (
      <Card className="border-dashed shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="text-sm">Nessun allenamento pianificato per oggi</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Count total exercises across all phases
  const totalExercises = todayWorkout.phases?.reduce((acc, phase) => {
    const groupExercises = phase.groups?.reduce((gAcc, group) => {
      return gAcc + (group.exercises?.length || 0);
    }, 0) || 0;
    return acc + groupExercises;
  }, 0) || 0;

  return (
    <Card className="border-l-4 border-l-primary shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Allenamento di oggi
              </p>
              <Badge variant="outline" className="text-xs">
                Da fare
              </Badge>
            </div>
            <p className="text-base font-semibold text-foreground mt-1">
              {todayWorkout.title || `Giorno ${todayWorkout.order || 1}`}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalExercises} esercizi
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
