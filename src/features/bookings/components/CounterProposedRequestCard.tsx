import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Clock, ArrowDown, Trash2, CircleDot, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ClientColorDot } from "@/components/calendar/ClientColorDot";
import type { BookingRequestWithClient } from "../types";

interface CounterProposedRequestCardProps {
  request: BookingRequestWithClient;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function CounterProposedRequestCard({
  request,
  onDelete,
  isDeleting,
}: CounterProposedRequestCardProps) {
  const originalStart = new Date(request.requested_start_at);
  const originalEnd = new Date(request.requested_end_at);
  
  const proposedStart = request.counter_proposal_start_at
    ? new Date(request.counter_proposal_start_at)
    : null;
  const proposedEnd = request.counter_proposal_end_at
    ? new Date(request.counter_proposal_end_at)
    : null;

  const formatDateTime = (date: Date) => {
    return format(date, "EEE d MMM · HH:mm", { locale: it });
  };

  const formatTime = (date: Date) => {
    return format(date, "HH:mm");
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header with status badge */}
        <div className="bg-amber-50 dark:bg-amber-950/30 px-4 py-2 border-b border-amber-100 dark:border-amber-900/50">
          <div className="flex items-center justify-between">
            <Badge className="bg-amber-500 hover:bg-amber-500 text-white font-medium">
              IN ATTESA DEL CLIENTE
            </Badge>
            <span className="text-xs text-amber-600 dark:text-amber-400">
              ⏳ Nessuna azione richiesta
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Client info */}
          <div className="flex items-center gap-2">
            <ClientColorDot clientId={request.coach_client_id} />
            <span className="font-semibold text-foreground">
              {request.client_name}
            </span>
          </div>

          {/* Timeline */}
          <div className="relative pl-6 space-y-3">
            {/* Vertical line */}
            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border" />
            
            {/* Original request */}
            <div className="relative">
              <CircleDot className="absolute -left-6 top-0.5 h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <span className="text-muted-foreground">Richiesta iniziale</span>
                <div className="text-muted-foreground/60 line-through">
                  {formatDateTime(originalStart)} – {formatTime(originalEnd)}
                </div>
              </div>
            </div>

            {/* Proposed time */}
            {proposedStart && proposedEnd && (
              <div className="relative">
                <CheckCircle2 className="absolute -left-6 top-0.5 h-4 w-4 text-amber-500" />
                <div className="text-sm">
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Tua proposta</span>
                  <div className="font-medium text-foreground">
                    {formatDateTime(proposedStart)} – {formatTime(proposedEnd)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action */}
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(request.id)}
              disabled={isDeleting}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Annulla richiesta
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
