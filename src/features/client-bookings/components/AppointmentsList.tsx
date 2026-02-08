import { useMemo, useState } from "react";
import { ChevronDown, Calendar, CheckCircle2, Hourglass, XCircle, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ClientSectionHeader } from "@/components/client/ClientSectionHeader";
import { ClientHistoryItem } from "@/components/client/ClientHistoryItem";
import { ClientEmptyState } from "@/components/client/ClientEmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO, isBefore } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientAppointmentView, ClientAppointmentStatus } from "../types";
import { cn } from "@/lib/utils";

interface AppointmentsListProps {
  appointments: ClientAppointmentView[];
  onSelect: (appointment: ClientAppointmentView) => void;
}

function getStatusBadge(status: ClientAppointmentStatus): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } {
  switch (status) {
    case 'CONFIRMED':
      return { label: 'Confermato', variant: 'secondary' };
    case 'REQUESTED':
      return { label: 'In attesa', variant: 'outline' };
    case 'CANCELLED':
      return { label: 'Annullato', variant: 'destructive' };
    case 'COMPLETED':
      return { label: 'Completato', variant: 'secondary' };
    case 'CHANGE_PROPOSED':
      return { label: 'Proposta', variant: 'outline' };
    default:
      return { label: '', variant: 'secondary' };
  }
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
      if (!isBefore(aptDate, now) && (apt.status === 'CONFIRMED' || apt.status === 'REQUESTED')) {
        future.push(apt);
      }
      if (apt.status === 'COMPLETED' || apt.status === 'CANCELLED') {
        past.push(apt);
      }
    }

    future.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    past.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

    return { future, past };
  }, [appointments]);

  return (
    <div className="space-y-4">
      {/* Future appointments */}
      <Collapsible open={futureOpen} onOpenChange={setFutureOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between py-2">
            <ClientSectionHeader title="Appuntamenti futuri" count={future.length} />
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              futureOpen && "rotate-180"
            )} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {future.length === 0 ? (
            <Card className="border-dashed mt-2">
              <CardContent className="p-4">
                <p className="text-[15px] leading-6 text-muted-foreground text-center">
                  Nessun appuntamento futuro
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="divide-y mt-2">
              {future.map(apt => {
                const badge = getStatusBadge(apt.status);
                return (
                  <ClientHistoryItem
                    key={apt.id}
                    title={apt.title}
                    date={format(parseISO(apt.startAt), "EEEE d MMM", { locale: it })}
                    time={format(parseISO(apt.startAt), "HH:mm")}
                    badge={badge}
                    onClick={() => onSelect(apt)}
                  />
                );
              })}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Past appointments */}
      <Collapsible open={pastOpen} onOpenChange={setPastOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between py-2">
            <ClientSectionHeader title="Storico appuntamenti" count={past.length} />
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              pastOpen && "rotate-180"
            )} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {past.length === 0 ? (
            <Card className="border-dashed mt-2">
              <CardContent className="p-4">
                <p className="text-[15px] leading-6 text-muted-foreground text-center">
                  Nessun appuntamento passato
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="divide-y mt-2">
              {past.slice(0, 20).map(apt => {
                const badge = getStatusBadge(apt.status);
                return (
                  <ClientHistoryItem
                    key={apt.id}
                    title={apt.title}
                    date={format(parseISO(apt.startAt), "d MMM yyyy", { locale: it })}
                    time={format(parseISO(apt.startAt), "HH:mm")}
                    badge={badge}
                    onClick={() => onSelect(apt)}
                  />
                );
              })}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
