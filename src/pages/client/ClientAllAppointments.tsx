import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, CalendarX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  const [selectedAppointment, setSelectedAppointment] = useState<ClientAppointmentView | null>(null);

  const pastAppointments = useMemo(() => {
    if (!appointments) return [];
    const now = new Date();
    return appointments
      .filter(a => 
        a.status === 'COMPLETED' || 
        (a.status === 'CONFIRMED' && new Date(a.startAt) <= now)
      )
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
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
              <p className="text-[15px] leading-6 text-muted-foreground">{formattedTime}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
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
      <Link 
        to="/client/app/appointments" 
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Indietro
      </Link>

      <ClientPageHeader 
        title="Storico appuntamenti" 
        description="I tuoi appuntamenti passati"
      />

      {pastAppointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <CalendarX className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">Nessun appuntamento passato</p>
          <p className="text-[15px] leading-6 text-muted-foreground mt-1">Lo storico dei tuoi appuntamenti apparirà qui</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pastAppointments.map(renderAppointmentCard)}
        </div>
      )}

      <AppointmentDetailSheet
        appointment={selectedAppointment}
        open={!!selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
      />
    </ClientPageShell>
  );
}
