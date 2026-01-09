import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar, Clock, ArrowRight, Trash2 } from "lucide-react";
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
    return format(date, "EEE d MMM, HH:mm", { locale: it });
  };

  return (
    <Card className="overflow-hidden border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10">
      <CardContent className="p-4 space-y-3">
        {/* Header con cliente e badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClientColorDot
              clientId={request.coach_client_id}
            />
            <span className="font-semibold text-foreground">
              {request.client_name}
            </span>
          </div>
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
            In attesa risposta
          </Badge>
        </div>

        {/* Confronto date */}
        <div className="space-y-2">
          {/* Data originale (barrata) */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground line-through opacity-60">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDateTime(originalStart)} – {format(originalEnd, "HH:mm")}
            </span>
          </div>

          {/* Freccia */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowRight className="h-4 w-4 ml-0.5" />
          </div>

          {/* Nuova proposta */}
          {proposedStart && proposedEnd && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="font-medium text-foreground">
                {formatDateTime(proposedStart)} – {format(proposedEnd, "HH:mm")}
              </span>
            </div>
          )}
        </div>

        {/* Azione */}
        <div className="pt-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(request.id)}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Annulla richiesta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
