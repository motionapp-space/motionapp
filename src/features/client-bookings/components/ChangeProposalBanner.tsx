import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CalendarClock, Check, X } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientAppointmentView } from "../types";

interface ChangeProposalBannerProps {
  appointment: ClientAppointmentView;
  onAccept: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export function ChangeProposalBanner({ 
  appointment, 
  onAccept, 
  onReject,
  isLoading 
}: ChangeProposalBannerProps) {
  if (!appointment.proposedStartAt || !appointment.proposedEndAt) {
    return null;
  }

  const proposedStart = new Date(appointment.proposedStartAt);
  const proposedEnd = new Date(appointment.proposedEndAt);
  const formattedDay = format(proposedStart, "EEEE d MMMM", { locale: it });
  const formattedTime = `${format(proposedStart, "HH:mm")} – ${format(proposedEnd, "HH:mm")}`;

  return (
    <Alert className="border-primary/20 bg-primary/5">
      <CalendarClock className="h-4 w-4 text-foreground" />
      <AlertTitle className="text-foreground">Proposta di modifica</AlertTitle>
      <AlertDescription className="text-muted-foreground">
        <p className="mb-3 text-[15px] leading-6">
          Il coach propone un nuovo orario per <strong>{appointment.title}</strong>:
        </p>
        <p className="font-medium capitalize mb-4">
          {formattedDay} alle {formattedTime}
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
