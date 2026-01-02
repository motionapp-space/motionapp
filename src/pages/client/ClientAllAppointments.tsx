import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, CalendarCheck, CalendarX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientPageHeader } from "@/components/client/ClientPageHeader";
import { ClientPageShell } from "@/components/client/ClientPageShell";
import { useClientAppointmentsView } from "@/features/client-bookings/hooks/useClientAppointmentsView";
import { AppointmentDetailSheet } from "@/features/client-bookings/components/AppointmentDetailSheet";
import type { ClientAppointmentView } from "@/features/client-bookings/types";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function ClientAllAppointments() {
  const { data: appointments, isLoading } = useClientAppointmentsView();
  const [tab, setTab] = useState<'future' | 'past'>('future');
  const [selectedAppointment, setSelectedAppointment] = useState<ClientAppointmentView | null>(null);

  const { futureAppointments, pastAppointments } = useMemo(() => {
    if (!appointments) return { futureAppointments: [], pastAppointments: [] };

    const now = new Date();

    const future = appointments
      .filter(a => 
        a.status === 'CONFIRMED' && 
        new Date(a.startAt) > now
      )
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    const past = appointments
      .filter(a => 
        a.status === 'COMPLETED' || 
        (a.status === 'CONFIRMED' && new Date(a.startAt) <= now)
      )
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

    return { futureAppointments: future, pastAppointments: past };
  }, [appointments]);

  const renderAppointmentCard = (appointment: ClientAppointmentView) => {
    const startDate = new Date(appointment.startAt);
    const endDate = new Date(appointment.endAt);
    const formattedDate = format(startDate, "EEEE d MMMM", { locale: it });
    const formattedTime = `${format(startDate, "HH:mm")} – ${format(endDate, "HH:mm")}`;

    return (
      <Card 
        key={appointment.id}
        className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setSelectedAppointment(appointment)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-medium capitalize text-foreground truncate">{formattedDate}</p>
              <p className="text-sm text-muted-foreground">{formattedTime}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = (type: 'future' | 'past') => {
    const Icon = type === 'future' ? CalendarCheck : CalendarX;
    const title = type === 'future' 
      ? "Nessun appuntamento futuro" 
      : "Nessun appuntamento passato";
    const description = type === 'future'
      ? "I tuoi prossimi appuntamenti appariranno qui"
      : "Lo storico dei tuoi appuntamenti apparirà qui";

    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <ClientPageShell className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </ClientPageShell>
    );
  }

  return (
    <ClientPageShell className="space-y-4">
      {/* Back link */}
      <Link 
        to="/client/app/appointments" 
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Indietro
      </Link>

      <ClientPageHeader 
        title="Tutti gli appuntamenti" 
        description="Storico completo dei tuoi appuntamenti"
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'future' | 'past')}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="future">
            Futuri ({futureAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Passati ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="future" className="mt-4 space-y-2">
          {futureAppointments.length === 0 
            ? renderEmptyState('future')
            : futureAppointments.map(renderAppointmentCard)
          }
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-2">
          {pastAppointments.length === 0 
            ? renderEmptyState('past')
            : pastAppointments.map(renderAppointmentCard)
          }
        </TabsContent>
      </Tabs>

      <AppointmentDetailSheet
        appointment={selectedAppointment}
        open={!!selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
      />
    </ClientPageShell>
  );
}
