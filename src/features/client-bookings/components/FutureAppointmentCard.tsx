import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientAppointmentView } from "../types";

interface FutureAppointmentCardProps {
  appointment: ClientAppointmentView;
  onClick: () => void;
}

function getStatusBadge(status: ClientAppointmentView["status"]) {
  switch (status) {
    case "CONFIRMED":
      return <Badge variant="default" className="bg-success/10 text-foreground border-success/40 text-xs">Confermato</Badge>;
    case "REQUESTED":
      return <Badge variant="secondary" className="bg-warning/10 text-foreground border-warning/40 text-xs">In attesa</Badge>;
    case "CHANGE_PROPOSED":
      return <Badge variant="secondary" className="bg-primary/5 text-foreground border-primary/20 text-xs">Proposta</Badge>;
    default:
      return null;
  }
}

export function FutureAppointmentCard({ appointment, onClick }: FutureAppointmentCardProps) {
  const startDate = new Date(appointment.startAt);
  const formattedDate = format(startDate, "EEEE d MMM, HH:mm", { locale: it });

  return (
    <Card 
      className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground truncate">
              {appointment.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
              {formattedDate}
            </p>
          </div>
          {getStatusBadge(appointment.status)}
        </div>
      </CardContent>
    </Card>
  );
}
