import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientAppointmentView } from "../types";

interface PendingRequestCardProps {
  request: ClientAppointmentView;
}

export function PendingRequestCard({ request }: PendingRequestCardProps) {
  const startDate = new Date(request.startAt);
  const endDate = new Date(request.endAt);
  
  const formattedDate = format(startDate, "EEEE d MMMM", { locale: it });
  const formattedTime = `${format(startDate, "HH:mm")} – ${format(endDate, "HH:mm")}`;

  return (
    <Card className="shadow-sm" data-testid="request-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">Richiesta inviata</p>
            <p className="font-medium capitalize text-foreground">{formattedDate}</p>
            <p className="text-sm text-muted-foreground">{formattedTime}</p>
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            In attesa
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          In attesa di conferma dal coach.
        </p>
      </CardContent>
    </Card>
  );
}
