import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Dumbbell } from "lucide-react";
import type { ClientActivePlan } from "../api/client-plans.api";

interface ClientWorkoutTodayCardProps {
  plan: ClientActivePlan | null | undefined;
  isLoading: boolean;
}

export function ClientWorkoutTodayCard({ plan, isLoading }: ClientWorkoutTodayCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  // Find today's workout day based on day index or name
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  const days = plan?.data?.days || [];
  
  // Simple logic: map day index to workout day (Mon=0, Tue=1, etc. in our plan)
  // This is a simplified approach - could be enhanced with actual scheduling logic
  const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Mon=0 format
  const todayWorkout = days.length > 0 ? days[todayIndex % days.length] : null;

  if (!plan || !todayWorkout) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Calendar className="h-5 w-5" />
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
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            Allenamento di oggi
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            Da fare
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="font-semibold text-foreground">
          {todayWorkout.title || `Giorno ${todayWorkout.order || 1}`}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {totalExercises} esercizi
        </p>
      </CardContent>
    </Card>
  );
}
