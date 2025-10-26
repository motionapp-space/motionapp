import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, User, MapPin, MessageSquare, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { formatTimeRange, getEventDuration } from "@/features/events/utils/calendar-utils";
import { generateAvailableSlots, findNearestSlots } from "../utils/slot-generator";
import {
  useApproveBookingRequest,
  useDeclineBookingRequest,
  useCounterProposeBookingRequest,
} from "../hooks/useBookingRequests";
import { useBookingSettingsQuery } from "../hooks/useBookingSettings";
import { useAvailabilityWindowsQuery } from "../hooks/useAvailability";
import { useOutOfOfficeBlocksQuery } from "../hooks/useOutOfOffice";
import { useEventsQuery } from "@/features/events/hooks/useEventsQuery";
import type { BookingRequestWithClient } from "../types";

interface BookingRequestDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: BookingRequestWithClient;
}

export function BookingRequestDrawer({
  open,
  onOpenChange,
  request,
}: BookingRequestDrawerProps) {
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);

  const approveMutation = useApproveBookingRequest();
  const declineMutation = useDeclineBookingRequest();
  const counterProposeMutation = useCounterProposeBookingRequest();

  const { data: settings } = useBookingSettingsQuery();
  const { data: availabilityWindows = [] } = useAvailabilityWindowsQuery();
  const { data: oooBlocks = [] } = useOutOfOfficeBlocksQuery();
  const { data: events = [] } = useEventsQuery();

  // Generate smart alternative slots
  const alternatives = useMemo(() => {
    if (!request || !settings) return [];

    const requestedDate = parseISO(request.requested_start_at);
    const allSlots = generateAvailableSlots({
      date: requestedDate,
      slotDurationMinutes: settings.slot_duration_minutes,
      minAdvanceNoticeHours: settings.min_advance_notice_hours,
      availabilityWindows,
      outOfOfficeBlocks: oooBlocks,
      existingEvents: events,
    });

    return findNearestSlots(requestedDate, allSlots);
  }, [request, settings, availabilityWindows, oooBlocks, events]);

  if (!request) return null;

  const duration = getEventDuration(
    request.requested_start_at,
    request.requested_end_at
  );

  const handleApprove = async () => {
    await approveMutation.mutateAsync(request.id);
    onOpenChange(false);
  };

  const handleDecline = async () => {
    if (confirm("Sei sicuro di voler rifiutare questa richiesta?")) {
      await declineMutation.mutateAsync(request.id);
      onOpenChange(false);
    }
  };

  const handleCounterPropose = async () => {
    if (!selectedAlternative) return;
    
    const slot = alternatives.find((s) => s.start === selectedAlternative);
    if (!slot) return;

    await counterProposeMutation.mutateAsync({
      id: request.id,
      counterStart: slot.start,
      counterEnd: slot.end,
    });
    onOpenChange(false);
    setSelectedAlternative(null);
  };

  const isLoading =
    approveMutation.isPending ||
    declineMutation.isPending ||
    counterProposeMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Richiesta di prenotazione</SheetTitle>
          <SheetDescription>
            Gestisci la richiesta di appuntamento
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-amber-600 border-amber-600">
              <Clock className="h-3 w-3 mr-1" />
              In attesa di approvazione
            </Badge>
          </div>

          {/* Client Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">{request.client_name}</div>
                <div className="text-xs text-muted-foreground">Cliente</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">
                  {format(parseISO(request.requested_start_at), "EEEE d MMMM yyyy", {
                    locale: it,
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTimeRange(
                    request.requested_start_at,
                    request.requested_end_at,
                    false
                  )}{" "}
                  · {duration} min
                </div>
              </div>
            </div>

            {request.notes && (
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Note</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {request.notes}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Smart Alternatives */}
          {alternatives.length > 0 && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold">Orari alternativi suggeriti</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Slot disponibili vicini all'orario richiesto
                </p>

                <div className="space-y-2">
                  {alternatives.map((slot) => (
                    <button
                      key={slot.start}
                      onClick={() => setSelectedAlternative(slot.start)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedAlternative === slot.start
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="text-sm font-medium">
                        {format(parseISO(slot.start), "EEEE d MMMM", { locale: it })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(parseISO(slot.start), "HH:mm")} -{" "}
                        {format(parseISO(slot.end), "HH:mm")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleApprove}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approva appuntamento
            </Button>

            {selectedAlternative && (
              <Button
                onClick={handleCounterPropose}
                disabled={isLoading}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Proponi orario alternativo
              </Button>
            )}

            <Button
              onClick={handleDecline}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rifiuta richiesta
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
