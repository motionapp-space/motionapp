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
    <Card className="border-amber-200 bg-amber-50/50">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-500/10 p-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Proposta del coach</span>
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-100">
                In attesa
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Il coach propone una modifica all'appuntamento
            </p>
          </div>
        </div>

        <div className="space-y-2 pl-11">
          <p className="text-sm font-medium text-foreground">{appointment.title}</p>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="capitalize">{proposedDate}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">Nuovo orario: {proposedTime}</span>
          </div>

          {appointment.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{appointment.location}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button 
            onClick={onAccept} 
            className="flex-1"
            disabled={isPending}
          >
            Accetta
          </Button>
          <Button 
            variant="outline" 
            onClick={onReject}
            className="flex-1 text-destructive hover:text-destructive"
            disabled={isPending}
          >
            Rifiuta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
