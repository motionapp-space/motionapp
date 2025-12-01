import { useCurrentClient } from "@/features/client/hooks/useCurrentClient";
import { useClientAppointments } from "@/features/client-appointments/hooks/useClientAppointments";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { formatTimeRange } from "@/features/events/utils/calendar-utils";

const ClientAppointments = () => {
  const { data: client, isLoading: clientLoading } = useCurrentClient();

  if (clientLoading) {
    return <p>Caricamento...</p>;
  }

  if (!client) {
    return <p>Account non collegato</p>;
  }

  const { data: appointments, isLoading, isError } = useClientAppointments(client.id);

  if (isLoading) {
    return <p>Sto caricando i tuoi appuntamenti...</p>;
  }

  if (isError) {
    return <p>Si è verificato un errore nel caricamento dei tuoi appuntamenti.</p>;
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Prenotazioni Cliente</h1>
          <p className="text-muted-foreground mt-2">
            Gestisci i tuoi appuntamenti
          </p>
        </div>

        <Card>
          <CardContent className="py-8 flex flex-col items-center text-center space-y-2">
            <CardTitle className="text-base font-semibold">Non hai ancora appuntamenti futuri.</CardTitle>
            <CardDescription>
              Contatta il tuo personal trainer per prenotare una sessione.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        return { label: "Da confermare", variant: "outline" as const };
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prenotazioni Cliente</h1>
        <p className="text-muted-foreground mt-2">
          Gestisci i tuoi appuntamenti
        </p>
      </div>

      <div className="space-y-4">
        {appointments.map((appointment) => {
          const dateLabel = formatDateLabel(appointment.start_at);
          const timeRange = formatTimeRange(
            appointment.start_at,
            appointment.end_at,
            appointment.is_all_day ?? false,
          );
          const status = getStatusBadge(appointment.session_status ?? null);
          const sourceLabel = formatSource(appointment.source ?? null);

          return (
            <Card key={appointment.id}>
              <CardHeader className="space-y-1 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {appointment.title}
                    </CardTitle>
                    <CardDescription>
                      {dateLabel}
                    </CardDescription>
                  </div>
                  {status && (
                    <Badge variant={status.variant}>{status.label}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium">
                  {timeRange}
                </p>
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
        })}
      </div>
    </div>
  );
};

export default ClientAppointments;
