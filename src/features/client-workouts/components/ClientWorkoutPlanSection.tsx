import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { ClientEmptyState } from "@/components/client/ClientEmptyState";
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
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (!plan) {
    return (
      <Card className="border-dashed shadow-sm">
        <CardContent className="p-5">
          <ClientEmptyState
            icon={FileText}
            title="Nessun piano attivo"
            description="Contatta il tuo coach per ricevere un piano personalizzato"
          />
        </CardContent>
      </Card>
    );
  }

  const days = plan.data?.days || [];

  if (days.length === 0) {
    return (
      <Card className="border-dashed shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground text-center">
            Il piano "{plan.name}" non contiene ancora giorni di allenamento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{plan.name}</p>
              <p className="text-xs text-muted-foreground">{days.length} giorni di allenamento</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-2">
        {days.map((day, index) => (
          <ClientWorkoutDayCard key={day.id} day={day} index={index} />
        ))}
      </div>
    </div>
  );
}
