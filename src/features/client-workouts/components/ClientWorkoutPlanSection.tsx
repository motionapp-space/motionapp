import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { ClientWorkoutDayCard } from "./ClientWorkoutDayCard";
import type { ClientActivePlan } from "../api/client-plans.api";

interface ClientWorkoutPlanSectionProps {
  plan: ClientActivePlan | null | undefined;
  isLoading: boolean;
}

export function ClientWorkoutPlanSection({ plan, isLoading }: ClientWorkoutPlanSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  if (!plan) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Non hai ancora un piano di allenamento attivo
            </p>
            <p className="text-xs text-muted-foreground">
              Contatta il tuo coach per ricevere un piano personalizzato
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const days = plan.data?.days || [];

  if (days.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground text-center">
            Il piano "{plan.name}" non contiene ancora giorni di allenamento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-2">
        Piano: <span className="font-medium text-foreground">{plan.name}</span>
      </p>
      {days.map((day, index) => (
        <ClientWorkoutDayCard key={day.id} day={day} index={index} />
      ))}
    </div>
  );
}
