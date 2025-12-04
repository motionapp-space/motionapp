import { Calendar, Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientAppointmentView } from "../types";

interface RequestedCardProps {
  appointment: ClientAppointmentView;
  onClick?: () => void;
}

export function RequestedCard({ appointment, onClick }: RequestedCardProps) {
  const date = format(parseISO(appointment.startAt), "EEEE d MMMM", { locale: it });
  const time = `${format(parseISO(appointment.startAt), "HH:mm")} – ${format(parseISO(appointment.endAt), "HH:mm")}`;

  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="font-medium text-foreground">{appointment.title}</p>
            <Badge variant="secondary" className="text-xs">
              In attesa di conferma
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="capitalize">{date}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{time}</span>
          </div>

          {appointment.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{appointment.location}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
