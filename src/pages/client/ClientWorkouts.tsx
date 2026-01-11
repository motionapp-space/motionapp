import { useState, useRef } from "react";
import { User, Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientPageShell } from "@/components/client/ClientPageShell";
import { ClientPageHeader } from "@/components/client/ClientPageHeader";
import { ClientEmptyState } from "@/components/client/ClientEmptyState";
import { useCurrentClient } from "@/features/client/hooks/useCurrentClient";
import { useClientActivePlan } from "@/features/client-workouts/hooks/useClientActivePlan";
import { useClientSessions } from "@/features/client-workouts/hooks/useClientSessions";
import { useNextWorkoutDay } from "@/features/client-workouts/hooks/useNextWorkoutDay";
import { useWeeklyProgress } from "@/features/client-workouts/hooks/useWeeklyProgress";
import { WeeklyProgressHero } from "@/features/client-workouts/components/WeeklyProgressHero";
import { NextWorkoutCTA } from "@/features/client-workouts/components/NextWorkoutCTA";
import { WeekCompletedCard } from "@/features/client-workouts/components/WeekCompletedCard";
import { ActivePlanCollapsible } from "@/features/client-workouts/components/ActivePlanCollapsible";
import { ChangeDaySheet, type PlanDayOption } from "@/features/client-workouts/components/ChangeDaySheet";
import { SessionHistorySection } from "@/features/client-workouts/components/SessionHistorySection";
import { WorkoutDayDetailSheet } from "@/features/client-workouts/components/WorkoutDayDetailSheet";
import { PlanOverviewSheet } from "@/features/client-workouts/components/PlanOverviewSheet";
import { countDayExercises } from "@/features/client-workouts/utils/plan-utils";

export default function ClientWorkouts() {
  const { data: client, isLoading: isClientLoading } = useCurrentClient();

  if (isClientLoading) {
    return (
      <ClientPageShell>
        <div className="space-y-4">
          <Skeleton className="h-[220px] w-full rounded-xl" />
          <Skeleton className="h-[160px] w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </ClientPageShell>
    );
  }

  if (!client) {
    return (
      <ClientPageShell>
        <Card className="border-dashed shadow-sm">
          <CardContent className="p-5">
            <ClientEmptyState
              icon={User}
              title="Account non collegato"
              description="Il tuo account non è ancora collegato a un profilo cliente. Contatta il tuo personal trainer."
            />
          </CardContent>
        </Card>
      </ClientPageShell>
    );
  }

  return <ClientWorkoutsContent />;
}

function ClientWorkoutsContent() {
  const { data: activePlan, isLoading: isPlanLoading } = useClientActivePlan();
  const { data: sessions, isLoading: isSessionsLoading } = useClientSessions();
  const { day: nextDay, exerciseCount } = useNextWorkoutDay(activePlan, sessions);
  
  const isLoading = isPlanLoading || isSessionsLoading;
  
  // Weekly progress hook
  const weekly = useWeeklyProgress(activePlan, sessions, isLoading);
  
  // State for sheets
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [planOverviewOpen, setPlanOverviewOpen] = useState(false);
  const [changeDayOpen, setChangeDayOpen] = useState(false);
  
  // State for selected day (when user changes from default)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  
  // Ref for scrolling to history
  const historyRef = useRef<HTMLDivElement>(null);

  // Determine display day (selected or next)
  const displayDay = selectedDayId
    ? activePlan?.data?.days?.find((d) => d.id === selectedDayId)
    : nextDay;

  // Prepare days for ChangeDaySheet and ActivePlanCollapsible
  const planDaysForSheet: PlanDayOption[] = (activePlan?.data?.days || []).map((d) => ({
    id: d.id,
    title: d.title,
    exercisesCount: countDayExercises(d),
    isCompletedThisWeek: weekly.completedDayIds.has(d.id),
    estimatedMinutes: 45, // placeholder
  }));

  const handleSelectDay = (dayId: string) => {
    setSelectedDayId(dayId);
    setChangeDayOpen(false);
  };

  const handleGoHistory = () => {
    historyRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDayClickFromCollapsible = (dayId: string) => {
    const day = activePlan?.data?.days?.find((d) => d.id === dayId);
    if (day) {
      setSelectedDayId(dayId);
      setDayDetailOpen(true);
    }
  };

  // Empty state: no plan assigned
  const hasNoPlan = !isLoading && (!activePlan || !activePlan.data?.days?.length);

  return (
    <ClientPageShell>
      <div className="space-y-6">
        {/* Page Header - Consistent with Home/Prenotazioni */}
        <ClientPageHeader 
          title="Allenamenti" 
          description="Il tuo piano e le sessioni registrate"
        />

        {/* 1. HERO - Weekly Progress */}
        <WeeklyProgressHero
          completedCount={weekly.completedCount}
          totalDays={weekly.totalDays}
          remainingCount={weekly.remainingCount}
          percentage={weekly.percentage}
          isWeekCompleted={weekly.isWeekCompleted}
          weekDays={weekly.weekDays}
          isLoading={weekly.isLoading}
        />

        {/* 2. NEXT WORKOUT CTA or WEEK COMPLETED */}
        {hasNoPlan ? (
          <section>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
              Prossimo allenamento
            </p>
            <Card className="border-dashed shadow-sm">
              <CardContent className="p-5">
                <ClientEmptyState
                  icon={Dumbbell}
                  title="Nessun piano attivo"
                  description="Quando il piano sarà pronto, potrai registrare i tuoi allenamenti qui."
                />
              </CardContent>
            </Card>
          </section>
        ) : weekly.isWeekCompleted ? (
          <WeekCompletedCard
            onViewPlan={() => setPlanOverviewOpen(true)}
            onGoHistory={handleGoHistory}
          />
        ) : (
          <NextWorkoutCTA
            title={displayDay?.title || "Allenamento"}
            exercisesCount={displayDay ? countDayExercises(displayDay) : exerciseCount}
            estimatedMinutes={45}
            status="todo"
            onStart={() => {}}
            onChangeDay={() => setChangeDayOpen(true)}
            onViewDetail={() => setDayDetailOpen(true)}
            startDisabled
            startDisabledReason="Funzionalità in arrivo"
            isLoading={isLoading}
          />
        )}

        {/* 3. ACTIVE PLAN (collapsible) */}
        {!hasNoPlan && (
          <ActivePlanCollapsible
            planName={activePlan?.name || ""}
            daysCount={activePlan?.data?.days?.length || 0}
            days={planDaysForSheet}
            isLoading={isPlanLoading}
            onDayClick={handleDayClickFromCollapsible}
          />
        )}

        {/* 4. SESSION HISTORY */}
        <div ref={historyRef}>
          <SessionHistorySection
            sessions={sessions}
            plan={activePlan}
            isLoading={isSessionsLoading}
          />
        </div>
      </div>

      {/* Sheets */}
      <ChangeDaySheet
        open={changeDayOpen}
        onOpenChange={setChangeDayOpen}
        days={planDaysForSheet}
        currentDayId={displayDay?.id}
        onSelectDay={handleSelectDay}
      />

      <WorkoutDayDetailSheet
        day={displayDay || null}
        open={dayDetailOpen}
        onOpenChange={setDayDetailOpen}
      />

      <PlanOverviewSheet
        plan={activePlan}
        sessions={sessions}
        open={planOverviewOpen}
        onOpenChange={setPlanOverviewOpen}
      />
    </ClientPageShell>
  );
}
