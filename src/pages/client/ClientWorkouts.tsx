import { useCurrentClient } from "@/features/client/hooks/useCurrentClient";
import { useClientActivePlan } from "@/features/client-workouts/hooks/useClientActivePlan";
import { useClientSessions } from "@/features/client-workouts/hooks/useClientSessions";
import { ClientWorkoutTodayCard } from "@/features/client-workouts/components/ClientWorkoutTodayCard";
import { ClientWorkoutPlanSection } from "@/features/client-workouts/components/ClientWorkoutPlanSection";
import { ClientSessionHistoryList } from "@/features/client-workouts/components/ClientSessionHistoryList";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientWorkouts() {
  const { data: client, isLoading: isClientLoading } = useCurrentClient();

  if (isClientLoading) {
    return (
      <div className="px-4 py-4 space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="px-4 py-8 space-y-2">
        <h1 className="text-xl font-semibold">Allenamenti</h1>
        <p className="text-sm text-muted-foreground">
          Il tuo account non è ancora collegato a un profilo cliente. Contatta il tuo personal trainer.
        </p>
      </div>
    );
  }

  return <ClientWorkoutsContent clientId={client.id} />;
}

function ClientWorkoutsContent({ clientId }: { clientId: string }) {
  const { data: activePlan, isLoading: isPlanLoading } = useClientActivePlan(clientId);
  const { data: sessions, isLoading: isSessionsLoading } = useClientSessions(clientId);

  return (
    <div className="px-4 py-4 space-y-6 pb-20">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Allenamenti</h1>
        <p className="text-sm text-muted-foreground">
          Il tuo piano di allenamento e lo storico delle sessioni
        </p>
      </header>

      {/* Today's workout */}
      <ClientWorkoutTodayCard plan={activePlan} isLoading={isPlanLoading} />

      {/* Full plan */}
      <section className="space-y-3">
        <h2 className="text-base font-medium">Il tuo piano</h2>
        <ClientWorkoutPlanSection plan={activePlan} isLoading={isPlanLoading} />
      </section>

      {/* Session history */}
      <section className="space-y-3">
        <h2 className="text-base font-medium">Storico sessioni</h2>
        <ClientSessionHistoryList 
          sessions={sessions} 
          plan={activePlan} 
          isLoading={isSessionsLoading} 
        />
      </section>
    </div>
  );
}
