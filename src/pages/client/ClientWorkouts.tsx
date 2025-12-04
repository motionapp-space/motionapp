import { User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientPageHeader } from "@/components/client/ClientPageHeader";
import { ClientSectionHeader } from "@/components/client/ClientSectionHeader";
import { ClientEmptyState } from "@/components/client/ClientEmptyState";
import { useCurrentClient } from "@/features/client/hooks/useCurrentClient";
import { useClientActivePlan } from "@/features/client-workouts/hooks/useClientActivePlan";
import { useClientSessions } from "@/features/client-workouts/hooks/useClientSessions";
import { ClientWorkoutTodayCard } from "@/features/client-workouts/components/ClientWorkoutTodayCard";
import { ClientWorkoutPlanSection } from "@/features/client-workouts/components/ClientWorkoutPlanSection";
import { ClientSessionHistoryList } from "@/features/client-workouts/components/ClientSessionHistoryList";

export default function ClientWorkouts() {
  const { data: client, isLoading: isClientLoading } = useCurrentClient();

  if (isClientLoading) {
    return (
      <div className="px-5 py-5 space-y-6 pb-24">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
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

  return <ClientWorkoutsContent clientId={client.id} />;
}

function ClientWorkoutsContent({ clientId }: { clientId: string }) {
  const { data: activePlan, isLoading: isPlanLoading } = useClientActivePlan(clientId);
  const { data: sessions, isLoading: isSessionsLoading } = useClientSessions(clientId);

  return (
    <div className="px-5 py-5 space-y-6 pb-24">
      <ClientPageHeader 
        title="Allenamenti" 
        description="Il tuo piano di allenamento e lo storico delle sessioni"
      />

      {/* Today's workout */}
      <ClientWorkoutTodayCard plan={activePlan} isLoading={isPlanLoading} />

      {/* Full plan */}
      <section className="space-y-3">
        <ClientSectionHeader title="Il tuo piano" />
        <ClientWorkoutPlanSection plan={activePlan} isLoading={isPlanLoading} />
      </section>

      {/* Session history */}
      <section className="space-y-3">
        <ClientSectionHeader title="Storico sessioni" count={sessions?.length} />
        <ClientSessionHistoryList 
          sessions={sessions} 
          plan={activePlan} 
          isLoading={isSessionsLoading} 
        />
      </section>
    </div>
  );
}
