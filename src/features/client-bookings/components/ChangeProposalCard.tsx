import { Calendar, Clock, MapPin, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientAppointmentView } from "../types";

interface ChangeProposalCardProps {
  appointment: ClientAppointmentView;
  onAccept: () => void;
  onReject: () => void;
  isPending?: boolean;
}

export function ChangeProposalCard({ 
  appointment, 
  onAccept, 
  onReject,
  isPending 
}: ChangeProposalCardProps) {
  const proposedDate = appointment.proposedStartAt 
    ? format(parseISO(appointment.proposedStartAt), "EEEE d MMMM", { locale: it })
    : '';
  const proposedTime = appointment.proposedStartAt && appointment.proposedEndAt
    ? `${format(parseISO(appointment.proposedStartAt), "HH:mm")} – ${format(parseISO(appointment.proposedEndAt), "HH:mm")}`
    : '';

  return (
    <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Proposta del coach
              </p>
              <Badge variant="outline" className="text-xs text-amber-700 border-amber-300 bg-amber-100">
                In attesa
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Il coach propone una modifica all'appuntamento
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-background/80 rounded-lg p-4">
          <p className="text-base font-semibold text-foreground">{appointment.title}</p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="capitalize">{proposedDate}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{proposedTime}</span>
            </div>

            {appointment.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{appointment.location}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={onAccept} 
            className="flex-1 h-11"
            disabled={isPending}
          >
            Accetta
          </Button>
          <Button 
            variant="outline" 
            onClick={onReject}
            className="flex-1 h-11 text-destructive hover:text-destructive hover:bg-destructive/5"
            disabled={isPending}
          >
            Rifiuta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
