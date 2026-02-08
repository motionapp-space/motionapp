import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientAppointmentView } from "../types";

interface CounterProposalCardProps {
  request: ClientAppointmentView;
  onAccept: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export function CounterProposalCard({ 
  request, 
  onAccept, 
  onReject, 
  isLoading 
}: CounterProposalCardProps) {
  // Use counter-proposed times if available, otherwise fall back to original
  const proposedStartAt = request.counterProposedStartAt || request.startAt;
  const proposedEndAt = request.counterProposedEndAt || request.endAt;
  
  const proposedStart = new Date(proposedStartAt);
  const proposedEnd = new Date(proposedEndAt);
  
  const formattedDate = format(proposedStart, "EEEE d MMMM", { locale: it });
  const formattedTime = `${format(proposedStart, "HH:mm")} – ${format(proposedEnd, "HH:mm")}`;

  return (
    <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-800" data-testid="request-card">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Nuovo orario proposto
          </span>
        </div>
        
        {/* Proposed time */}
        <div>
          <p className="font-semibold text-foreground capitalize">{formattedDate}</p>
          <p className="text-[15px] leading-6 text-muted-foreground">{formattedTime}</p>
        </div>
        
        {/* Explanation */}
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Il coach non è disponibile nell'orario richiesto.
        </p>
        
        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button 
            size="sm" 
            onClick={onAccept}
            disabled={isLoading}
          >
            Accetta
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onReject}
            disabled={isLoading}
          >
            Rifiuta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
