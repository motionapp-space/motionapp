import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronRight, CalendarX } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientAppointmentView } from "../types";

interface NextAppointmentCardProps {
  appointment: ClientAppointmentView | null;
  isLoading: boolean;
  onClick: () => void;
}

function getStatusBadge(status: ClientAppointmentView["status"]) {
  switch (status) {
    case "CONFIRMED":
      return <Badge variant="default" className="bg-green-500/10 text-green-700 border-green-200">Confermato</Badge>;
    case "REQUESTED":
      return <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-amber-200">In attesa</Badge>;
    case "CHANGE_PROPOSED":
      return <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 border-blue-200">Proposta modifica</Badge>;
    default:
      return null;
  }
}

export function NextAppointmentCard({ 
  appointment, 
  isLoading, 
  onClick 
}: NextAppointmentCardProps) {
  if (isLoading) {
    return <Skeleton className="h-24 w-full rounded-xl" />;
  }

  // No upcoming appointment
  if (!appointment) {
    return (
      <Card className="shadow-sm border-dashed">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <CalendarX className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Nessun appuntamento</p>
              <p className="text-[15px] leading-6 text-muted-foreground mt-0.5">
                Prenota il tuo prossimo appuntamento
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const startDate = new Date(appointment.startAt);
  const endDate = new Date(appointment.endAt);
  const formattedDay = format(startDate, "EEEE d MMMM", { locale: it });
  const formattedTime = `${format(startDate, "HH:mm")} – ${format(endDate, "HH:mm")}`;

  return (
    <Card 
      className="shadow-sm border-l-4 border-l-primary hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-foreground truncate">
                {appointment.title}
              </p>
              {getStatusBadge(appointment.status)}
            </div>
            <p className="text-[15px] leading-6 text-foreground capitalize">
              {formattedDay}
            </p>
            <p className="text-[15px] leading-6 text-muted-foreground">
              {formattedTime}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
