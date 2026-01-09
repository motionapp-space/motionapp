import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar, Clock, Check, X, RefreshCw, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ClientColorDot } from "@/components/calendar/ClientColorDot";
import type { BookingRequestWithClient } from "../types";

interface PendingRequestCardProps {
  request: BookingRequestWithClient;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
  onCounterPropose: (request: BookingRequestWithClient) => void;
  isApproving?: boolean;
  isDeclining?: boolean;
}

export function PendingRequestCard({
  request,
  onApprove,
  onDecline,
  onCounterPropose,
  isApproving,
  isDeclining,
}: PendingRequestCardProps) {
  const startDate = new Date(request.requested_start_at);
  const endDate = new Date(request.requested_end_at);
  const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

  const formattedDate = format(startDate, "EEEE d MMMM yyyy", { locale: it });
  const formattedTime = `${format(startDate, "HH:mm")} – ${format(endDate, "HH:mm")}`;

  return (
    <Card className="overflow-hidden border-l-4 border-l-primary bg-card">
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
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            In attesa
          </Badge>
        </div>

        {/* Data e ora */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="capitalize">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{formattedTime}</span>
            <span className="text-muted-foreground">({durationMinutes} min)</span>
          </div>
        </div>

        {/* Note se presenti */}
        {request.notes && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
            <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="line-clamp-2">{request.notes}</p>
          </div>
        )}

        {/* Azioni */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => onApprove(request.id)}
            disabled={isApproving || isDeclining}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-1" />
            Approva
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDecline(request.id)}
            disabled={isApproving || isDeclining}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="h-4 w-4 mr-1" />
            Rifiuta
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onCounterPropose(request)}
            disabled={isApproving || isDeclining}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Cambia slot
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
