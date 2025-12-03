import { useCurrentClient } from "@/features/client/hooks/useCurrentClient";
import { useClientAppointments } from "@/features/client-appointments/hooks/useClientAppointments";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { formatTimeRange } from "@/features/events/utils/calendar-utils";
import { Calendar, CalendarX } from "lucide-react";
import type { ClientAppointment } from "@/features/client-appointments/api/client-appointments.api";

const ClientAppointments = () => {
  const { data: client, isLoading: clientLoading } = useCurrentClient();

  if (clientLoading) {
    return <p className="text-muted-foreground">Caricamento...</p>;
  }

  if (!client) {
    return <p className="text-muted-foreground">Account non collegato</p>;
  }

  return <ClientAppointmentsContent clientId={client.id} />;
};

function ClientAppointmentsContent({ clientId }: { clientId: string }) {
  const { data, isLoading, isError } = useClientAppointments(clientId);

  if (isLoading) {
    return <p className="text-muted-foreground">Sto caricando i tuoi appuntamenti...</p>;
  }

  if (isError) {
    return <p className="text-destructive">Si è verificato un errore nel caricamento dei tuoi appuntamenti.</p>;
  }

  const future = data?.future || [];
  const past = data?.past || [];
  const hasNoAppointments = future.length === 0 && past.length === 0;

  // Empty state generale se non ci sono appuntamenti
  if (hasNoAppointments) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">I tuoi appuntamenti</h1>
          <p className="text-muted-foreground mt-1">
            Visualizza i tuoi appuntamenti programmati
          </p>
        </div>

        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center space-y-3">
            <div className="rounded-full bg-muted p-4">
              <CalendarX className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-base font-semibold">
              Non hai ancora appuntamenti registrati
            </CardTitle>
            <CardDescription>
              Contatta il tuo personal trainer se hai bisogno di assistenza.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">I tuoi appuntamenti</h1>
        <p className="text-muted-foreground mt-1">
          Visualizza i tuoi appuntamenti programmati
        </p>
      </div>

      {/* Sezione Prossimi Appuntamenti */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Prossimi appuntamenti
        </h2>
        {future.length > 0 ? (
          <div className="space-y-3">
            {future.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Nessun appuntamento programmato
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Sezione Appuntamenti Recenti */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-muted-foreground">
          Appuntamenti recenti
        </h2>
        {past.length > 0 ? (
          <div className="space-y-3">
            {past.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} isPast />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Nessun appuntamento passato
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function AppointmentCard({ 
  appointment, 
  isPast = false 
}: { 
  appointment: ClientAppointment; 
  isPast?: boolean;
}) {
  const formatDateLabel = (iso: string) => {
    const date = parseISO(iso);
    return format(date, "EEEE d MMMM", { locale: it });
  };

  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case "scheduled":
        return { label: "Confermato", variant: "default" as const };
      case "done":
        return { label: "Completato", variant: "secondary" as const };
      case "canceled":
        return { label: "Annullato", variant: "destructive" as const };
      case "no_show":
        return { label: "Non presentato", variant: "outline" as const };
      default:
        return isPast 
          ? { label: "Completato", variant: "secondary" as const }
          : { label: "Da confermare", variant: "outline" as const };
    }
  };

  const formatSource = (source: string | null | undefined) => {
    switch (source) {
      case "client":
        return "Prenotato da te";
      case "manual":
        return "Inserito dal coach";
      case "generated":
        return "Generato automaticamente";
      default:
        return null;
    }
  };

  const dateLabel = formatDateLabel(appointment.start_at);
  const timeRange = formatTimeRange(
    appointment.start_at,
    appointment.end_at,
    appointment.is_all_day ?? false
  );
  const status = getStatusBadge(appointment.session_status ?? null);
  const sourceLabel = formatSource(appointment.source ?? null);

  return (
    <Card className={isPast ? "opacity-75" : ""}>
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">
              {appointment.title}
            </CardTitle>
            <CardDescription className="capitalize">
              {dateLabel}
            </CardDescription>
          </div>
          {status && (
            <Badge variant={status.variant}>{status.label}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p className="font-medium">{timeRange}</p>
        {appointment.location && (
          <p className="text-muted-foreground">
            Luogo: {appointment.location}
          </p>
        )}
        {sourceLabel && (
          <p className="text-muted-foreground text-xs">
            {sourceLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default ClientAppointments;
