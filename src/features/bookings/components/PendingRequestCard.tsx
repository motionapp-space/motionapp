import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar, Clock, Check, MoreHorizontal, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const isLoading = isApproving || isDeclining;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header with status badge */}
        <div className="bg-blue-50 dark:bg-blue-950/30 px-4 py-2 border-b border-blue-100 dark:border-blue-900/50">
          <div className="flex items-center justify-between">
            <Badge className="bg-blue-600 hover:bg-blue-600 text-white font-medium">
              DA APPROVARE
            </Badge>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              Azione richiesta
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

          {/* Date and time */}
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

          {/* Notes if present */}
          {request.notes && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md line-clamp-2">
              "{request.notes}"
            </div>
          )}

          {/* Actions - 1 primary + dropdown for secondary */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={() => onApprove(request.id)}
              disabled={isLoading}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-1.5" />
              Approva
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" disabled={isLoading}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onCounterPropose(request)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Proponi altro orario
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDecline(request.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Rifiuta richiesta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
