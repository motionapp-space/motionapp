import { useState } from "react";
import { User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ClientPageHeader } from "@/components/client/ClientPageHeader";
import { ClientEmptyState } from "@/components/client/ClientEmptyState";
import { useCurrentClient } from "@/features/client/hooks/useCurrentClient";
import { useClientActivePlan } from "@/features/client-workouts/hooks/useClientActivePlan";
import { useClientSessions } from "@/features/client-workouts/hooks/useClientSessions";
import { useNextWorkoutDay } from "@/features/client-workouts/hooks/useNextWorkoutDay";
import { NextWorkoutCard } from "@/features/client-workouts/components/NextWorkoutCard";
import { ActivePlanCard } from "@/features/client-workouts/components/ActivePlanCard";
import { SessionHistorySection } from "@/features/client-workouts/components/SessionHistorySection";
import { WorkoutDayDetailSheet } from "@/features/client-workouts/components/WorkoutDayDetailSheet";
import { PlanOverviewSheet } from "@/features/client-workouts/components/PlanOverviewSheet";

export default function ClientWorkouts() {
  const { data: client, isLoading: isClientLoading } = useCurrentClient();

  if (isClientLoading) {
    return (
      <div className="px-5 py-5 space-y-6 pb-24">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="px-5 py-5 space-y-6 pb-24">
        <ClientPageHeader 
          title="Allenamenti" 
          description="Il tuo piano di allenamento e lo storico delle sessioni"
        />
        <Card className="border-dashed shadow-sm">
          <CardContent className="p-5">
            <ClientEmptyState
              icon={User}
              title="Account non collegato"
              description="Il tuo account non è ancora collegato a un profilo cliente. Contatta il tuo personal trainer."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ClientWorkoutsContent />;
}

function ClientWorkoutsContent() {
  const { data: activePlan, isLoading: isPlanLoading } = useClientActivePlan();
  const { data: sessions, isLoading: isSessionsLoading } = useClientSessions();
  const { day: nextDay, exerciseCount, allCompleted } = useNextWorkoutDay(activePlan, sessions);
  
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [planOverviewOpen, setPlanOverviewOpen] = useState(false);

  const isLoading = isPlanLoading || isSessionsLoading;

  return (
    <div className="px-5 py-5 space-y-6 pb-24">
      <ClientPageHeader 
        title="Allenamenti" 
        description="Il tuo piano e le sessioni registrate"
      />

      {/* Section: Next workout */}
      <section>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
          Prossima sessione
        </p>
        <NextWorkoutCard
          day={nextDay}
          exerciseCount={exerciseCount}
          allCompleted={allCompleted}
          isLoading={isLoading}
          onClick={() => setDayDetailOpen(true)}
        />
      </section>

      {/* Section: Active plan */}
      <section>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
          Piano Attivo
        </p>
        <ActivePlanCard
          plan={activePlan}
          isLoading={isPlanLoading}
          onClick={() => setPlanOverviewOpen(true)}
        />
      </section>

      {/* Section: Session history */}
      <SessionHistorySection
        sessions={sessions}
        plan={activePlan}
        isLoading={isSessionsLoading}
      />

      {/* Sheets */}
      <WorkoutDayDetailSheet
        day={nextDay}
        open={dayDetailOpen}
        onOpenChange={setDayDetailOpen}
      />

      <PlanOverviewSheet
        plan={activePlan}
        sessions={sessions}
        open={planOverviewOpen}
        onOpenChange={setPlanOverviewOpen}
      />
    </div>
  );
}
