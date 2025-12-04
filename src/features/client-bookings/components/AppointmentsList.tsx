import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Calendar, Clock, CheckCircle2, Hourglass, XCircle, CheckCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format, parseISO, isBefore } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientAppointmentView, ClientAppointmentStatus } from "../types";

interface AppointmentsListProps {
  appointments: ClientAppointmentView[];
  onSelect: (appointment: ClientAppointmentView) => void;
}

function getStatusIcon(status: ClientAppointmentStatus) {
  switch (status) {
    case 'CONFIRMED':
      return <CheckCircle2 className="h-3 w-3 text-primary" />;
    case 'REQUESTED':
      return <Hourglass className="h-3 w-3 text-muted-foreground" />;
    case 'CANCELLED':
      return <XCircle className="h-3 w-3 text-destructive" />;
    case 'COMPLETED':
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    default:
      return null;
  }
}

function getStatusLabel(status: ClientAppointmentStatus): string {
  switch (status) {
    case 'CONFIRMED': return 'Confermato';
    case 'REQUESTED': return 'In attesa';
    case 'CHANGE_PROPOSED': return 'Proposta';
    case 'CANCELLED': return 'Annullato';
    case 'COMPLETED': return 'Completato';
  }
}

function AppointmentRow({ 
  appointment, 
  onClick 
}: { 
  appointment: ClientAppointmentView; 
  onClick: () => void;
}) {
  const date = format(parseISO(appointment.startAt), "d MMM", { locale: it });
  const time = format(parseISO(appointment.startAt), "HH:mm");

  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg transition-colors text-left"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{appointment.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <Calendar className="h-3 w-3" />
          <span>{date}</span>
          <Clock className="h-3 w-3 ml-1" />
          <span>{time}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs">
        {getStatusIcon(appointment.status)}
        <span className="text-muted-foreground">{getStatusLabel(appointment.status)}</span>
      </div>
    </button>
  );
}

export function AppointmentsList({ appointments, onSelect }: AppointmentsListProps) {
  const [futureOpen, setFutureOpen] = useState(false);
  const [pastOpen, setPastOpen] = useState(false);

  const { future, past } = useMemo(() => {
    const now = new Date();
    const future: ClientAppointmentView[] = [];
    const past: ClientAppointmentView[] = [];

    for (const apt of appointments) {
      const aptDate = parseISO(apt.startAt);
      // Future: CONFIRMED or REQUESTED that haven't passed
      if (!isBefore(aptDate, now) && (apt.status === 'CONFIRMED' || apt.status === 'REQUESTED')) {
        future.push(apt);
      }
      // Past: COMPLETED or CANCELLED, or any that have passed
      if (apt.status === 'COMPLETED' || apt.status === 'CANCELLED') {
        past.push(apt);
      }
    }

    // Sort future by date ascending
    future.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    // Sort past by date descending
    past.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

    return { future, past };
  }, [appointments]);

  return (
    <div className="space-y-3">
      {/* Future appointments */}
      <Collapsible open={futureOpen} onOpenChange={setFutureOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-3 h-auto py-3">
            <span className="font-medium">
              Appuntamenti futuri
              {future.length > 0 && (
                <span className="ml-2 text-muted-foreground">({future.length})</span>
              )}
            </span>
            {futureOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="p-2">
              {future.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessun appuntamento futuro
                </p>
              ) : (
                <div className="divide-y">
                  {future.map(apt => (
                    <AppointmentRow 
                      key={apt.id} 
                      appointment={apt} 
                      onClick={() => onSelect(apt)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Past appointments */}
      <Collapsible open={pastOpen} onOpenChange={setPastOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-3 h-auto py-3">
            <span className="font-medium">
              Storico appuntamenti
              {past.length > 0 && (
                <span className="ml-2 text-muted-foreground">({past.length})</span>
              )}
            </span>
            {pastOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="p-2">
              {past.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessun appuntamento completato
                </p>
              ) : (
                <div className="divide-y">
                  {past.slice(0, 20).map(apt => (
                    <AppointmentRow 
                      key={apt.id} 
                      appointment={apt} 
                      onClick={() => onSelect(apt)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
