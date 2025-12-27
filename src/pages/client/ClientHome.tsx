import { Calendar, Dumbbell, FileText, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientPageHeader } from "@/components/client/ClientPageHeader";
import { ClientEmptyState } from "@/components/client/ClientEmptyState";
import { useCurrentClient } from "@/features/client/hooks/useCurrentClient";
import { useClientActivePlan } from "@/features/client-workouts/hooks/useClientActivePlan";
import { useClientAppointmentsView } from "@/features/client-bookings/hooks/useClientAppointmentsView";
import { format, parseISO, isAfter } from "date-fns";
import { it } from "date-fns/locale";

export default function ClientHome() {
  const { data: client, isLoading: isClientLoading } = useCurrentClient();

  if (isClientLoading) {
    return (
      <div className="px-5 py-5 space-y-6 pb-24">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="px-5 py-5 space-y-6 pb-24">
        <ClientPageHeader 
          title="Home" 
          description="Benvenuto nella tua area personale"
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

  return <ClientHomeContent clientId={client.id} clientName={client.first_name} />;
}

function ClientHomeContent({ clientId, clientName }: { clientId: string; clientName: string }) {
  const { data: activePlan, isLoading: isPlanLoading } = useClientActivePlan();
  const { data: appointments, isLoading: isAppointmentsLoading } = useClientAppointmentsView();

  const isLoading = isPlanLoading || isAppointmentsLoading;

  // Get next confirmed appointment
  const now = new Date();
  const nextAppointment = appointments
    ?.filter(a => a.status === 'CONFIRMED' && isAfter(parseISO(a.startAt), now))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];

  // Get today's workout
  const dayOfWeek = now.getDay();
  const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const days = activePlan?.data?.days || [];
  const todayWorkout = days.length > 0 ? days[todayIndex % days.length] : null;

  const hasContent = nextAppointment || todayWorkout || activePlan;

  if (isLoading) {
    return (
      <div className="px-5 py-5 space-y-6 pb-24">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="px-5 py-5 space-y-6 pb-24">
      <ClientPageHeader 
        title="Home" 
        description={`Bentornato, ${clientName}`}
      />

      {!hasContent ? (
        <Card className="border-dashed shadow-sm">
          <CardContent className="p-5">
            <ClientEmptyState
              icon={Calendar}
              title="Inizia il tuo percorso"
              description="Non hai ancora appuntamenti o piani attivi. Contatta il tuo coach per iniziare."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Next Appointment Card */}
          {nextAppointment && (
            <Card className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        Prossimo appuntamento
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        Confermato
                      </Badge>
                    </div>
                    <p className="text-base font-semibold text-foreground mt-1">
                      {nextAppointment.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {format(parseISO(nextAppointment.startAt), "EEEE d MMMM", { locale: it })}
                      {" • "}
                      {format(parseISO(nextAppointment.startAt), "HH:mm")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Workout Card */}
          {todayWorkout && (
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
                      {todayWorkout.phases?.reduce((acc, phase) => {
                        const groupExercises = phase.groups?.reduce((gAcc, group) => {
                          return gAcc + (group.exercises?.length || 0);
                        }, 0) || 0;
                        return acc + groupExercises;
                      }, 0) || 0} esercizi
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Plan Card */}
          {activePlan && (
            <Card className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Piano attivo
                    </p>
                    <p className="text-base font-semibold text-foreground mt-1">
                      {activePlan.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {days.length} giorni di allenamento
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
