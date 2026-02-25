import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Check, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

  const formattedDateCompact = format(startDate, "EEE d MMM", { locale: it });
  const formattedTimeRange = `${format(startDate, "HH:mm")} – ${format(endDate, "HH:mm")}`;

  const isLoading = isApproving || isDeclining;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Info Block */}
        <div className="space-y-1">
          {/* Row 1: Badge + Date/Time */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="border-warning/50 bg-warning/10 text-foreground dark:text-warning text-xs font-medium px-2 py-1 pointer-events-none">
              Da approvare
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formattedDateCompact}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {formattedTimeRange}
            </span>
          </div>

          {/* Row 2: Client with ColorDot */}
          <div className="flex items-center gap-2">
            <ClientColorDot clientId={request.coach_client_id} />
            <span className="text-sm font-medium text-foreground truncate">
              {request.client_name}
            </span>
          </div>

          {/* Row 3: Metadata */}
          <p className="text-xs text-muted-foreground">
            Lezione singola · {durationMinutes} min
          </p>

          {/* Row 4: Notes (optional) */}
          {request.notes && (
            <p className="text-xs italic text-muted-foreground line-clamp-1">
              "{request.notes}"
            </p>
          )}
        </div>

        {/* Actions Block */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
          {/* Approve Button - Primary */}
          <Button
            onClick={() => onApprove(request.id)}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            <Check className="h-4 w-4" />
            Approva
          </Button>

          {/* Counter-propose Button - Outline */}
          <Button
            variant="outline"
            onClick={() => onCounterPropose(request)}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Controproponi
          </Button>

          {/* Decline Button - Ghost Destructive with AlertDialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-1 sm:flex-none"
                disabled={isLoading}
              >
                Rifiuta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Rifiutare la richiesta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Questa azione non può essere annullata. Il cliente verrà notificato del rifiuto.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onDecline(request.id)}
                >
                  Rifiuta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
