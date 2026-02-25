import { Calendar, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientAppointmentView } from "../types";

interface ConfirmedCardProps {
  appointment: ClientAppointmentView;
  onClick?: () => void;
}

export function ConfirmedCard({ appointment, onClick }: ConfirmedCardProps) {
  const date = format(parseISO(appointment.startAt), "EEEE d MMMM", { locale: it });
  const time = `${format(parseISO(appointment.startAt), "HH:mm")} – ${format(parseISO(appointment.endAt), "HH:mm")}`;

  return (
    <Card 
      className="cursor-pointer hover:bg-accent/30 transition-colors shadow-sm"
      onClick={onClick}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Prossimo appuntamento
              </p>
              <Badge variant="outline" className="text-xs border-success/50 bg-success/10 text-foreground dark:text-success">
                Confermato
              </Badge>
            </div>
            <p className="text-base font-semibold text-foreground mt-1">{appointment.title}</p>
          </div>
        </div>

        <div className="space-y-2 pl-13">
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
