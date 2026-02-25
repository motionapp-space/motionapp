import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientAppointmentView } from "../types";

interface PendingRequestCardProps {
  request: ClientAppointmentView;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PendingRequestCard({ request, onCancel, isLoading }: PendingRequestCardProps) {
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
            <p className="text-[15px] leading-6 text-muted-foreground">{formattedTime}</p>
          </div>
          <Badge variant="outline" className="text-xs shrink-0 border-warning/50 bg-warning/10 text-foreground dark:text-warning">
            In attesa
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          In attesa di conferma dal coach.
        </p>
        <div className="mt-3 pt-3 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onCancel}
            disabled={isLoading}
          >
            Annulla richiesta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
