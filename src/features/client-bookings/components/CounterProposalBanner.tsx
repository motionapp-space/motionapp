import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CalendarClock, Check, X } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientAppointmentView } from "../types";

interface CounterProposalBannerProps {
  appointment: ClientAppointmentView;
  onAccept: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export function CounterProposalBanner({ 
  appointment, 
  onAccept, 
  onReject,
  isLoading 
}: CounterProposalBannerProps) {
  if (!appointment.counterProposedStartAt || !appointment.counterProposedEndAt) {
    return null;
  }

  const originalStart = new Date(appointment.startAt);
  const proposedStart = new Date(appointment.counterProposedStartAt);
  const proposedEnd = new Date(appointment.counterProposedEndAt);
  
  const originalFormattedDay = format(originalStart, "EEEE d MMMM", { locale: it });
  const originalFormattedTime = format(originalStart, "HH:mm");
  
  const proposedFormattedDay = format(proposedStart, "EEEE d MMMM", { locale: it });
  const proposedFormattedTime = `${format(proposedStart, "HH:mm")} – ${format(proposedEnd, "HH:mm")}`;

  return (
    <Alert className="border-amber-200 bg-amber-50/50">
      <CalendarClock className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900">Controproposta dal coach</AlertTitle>
      <AlertDescription className="text-amber-700">
        <p className="mb-2">
          Hai richiesto un appuntamento per:
        </p>
        <p className="text-sm text-muted-foreground line-through mb-3 capitalize">
          {originalFormattedDay} alle {originalFormattedTime}
        </p>
        <p className="mb-2">
          Il coach propone invece:
        </p>
        <p className="font-medium capitalize mb-4">
          {proposedFormattedDay} alle {proposedFormattedTime}
        </p>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={onAccept}
            disabled={isLoading}
            className="gap-1"
          >
            <Check className="h-4 w-4" />
            Accetta
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onReject}
            disabled={isLoading}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Rifiuta
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
