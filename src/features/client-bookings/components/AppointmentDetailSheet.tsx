import { Calendar, Clock, MapPin, CheckCircle2, XCircle, Hourglass, CheckCheck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientAppointmentView, ClientAppointmentStatus } from "../types";
import { useCancelAppointment } from "../hooks/useCancelAppointment";
import { useCancelBookingRequest } from "../hooks/useCancelBookingRequest";
import { useRespondToChangeProposal } from "../hooks/useRespondToChangeProposal";

interface AppointmentDetailSheetProps {
  appointment: ClientAppointmentView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getStatusBadge(status: ClientAppointmentStatus) {
  switch (status) {
    case 'CONFIRMED':
      return (
        <Badge variant="outline" className="border-success/50 bg-success/10 text-foreground dark:text-success">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Confermato
        </Badge>
      );
    case 'REQUESTED':
      return (
        <Badge variant="outline" className="border-warning/50 bg-warning/10 text-foreground dark:text-warning">
          <Hourglass className="h-3 w-3 mr-1" />
          In attesa
        </Badge>
      );
    case 'CHANGE_PROPOSED':
      return (
        <Badge variant="outline" className="border-warning/50 bg-warning/10 text-foreground dark:text-warning">
          Proposta modifica
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="outline" className="border-destructive/50 bg-destructive/10 text-foreground dark:text-destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Annullato
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="outline" className="border-muted-foreground/50 bg-muted-foreground/10 text-foreground dark:text-muted-foreground">
          <CheckCheck className="h-3 w-3 mr-1" />
          Completato
        </Badge>
      );
  }
}

export function AppointmentDetailSheet({ 
  appointment, 
  open, 
  onOpenChange 
}: AppointmentDetailSheetProps) {
  const cancelAppointment = useCancelAppointment();
  const cancelRequest = useCancelBookingRequest();
  const { accept, reject, isPending: isRespondingPending } = useRespondToChangeProposal();

  if (!appointment) return null;

  const date = format(parseISO(appointment.startAt), "EEEE d MMMM yyyy", { locale: it });
  const time = `${format(parseISO(appointment.startAt), "HH:mm")} – ${format(parseISO(appointment.endAt), "HH:mm")}`;

  const handleCancel = async () => {
    if (appointment.type === 'booking_request') {
      await cancelRequest.mutateAsync(appointment.id);
    } else {
      await cancelAppointment.mutateAsync(appointment.id);
    }
    onOpenChange(false);
  };

  const handleAccept = () => {
    accept(appointment.id);
    onOpenChange(false);
  };

  const handleReject = () => {
    reject(appointment.id);
    onOpenChange(false);
  };

  const isCancelling = cancelAppointment.isPending || cancelRequest.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left">{appointment.title}</SheetTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge(appointment.status)}
          </div>
        </SheetHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="capitalize">{date}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span>{time}</span>
            </div>

            {appointment.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span>{appointment.location}</span>
              </div>
            )}
          </div>

          {/* Show proposed times for CHANGE_PROPOSED */}
          {appointment.status === 'CHANGE_PROPOSED' && appointment.proposedStartAt && (
            <>
              <Separator />
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
                <p className="text-[15px] leading-6 font-medium text-amber-800">Nuovo orario proposto</p>
                <div className="flex items-center gap-2 text-[15px] leading-6">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <span className="capitalize">
                    {format(parseISO(appointment.proposedStartAt), "EEEE d MMMM", { locale: it })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[15px] leading-6">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>
                    {format(parseISO(appointment.proposedStartAt), "HH:mm")} – 
                    {appointment.proposedEndAt && format(parseISO(appointment.proposedEndAt), "HH:mm")}
                  </span>
                </div>
              </div>
            </>
          )}

          {appointment.notes && (
            <>
              <Separator />
              <div>
                <p className="text-[15px] leading-6 text-muted-foreground mb-1">Note</p>
                <p className="text-[15px] leading-6">{appointment.notes}</p>
              </div>
            </>
          )}

          {/* Actions based on status */}
          <Separator />
          <div className="space-y-2 pb-4">
            {appointment.status === 'CHANGE_PROPOSED' && (
              <div className="flex gap-3">
                <Button 
                  onClick={handleAccept}
                  className="flex-1"
                  disabled={isRespondingPending}
                >
                  Accetta
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleReject}
                  className="flex-1 text-destructive hover:text-destructive"
                  disabled={isRespondingPending}
                >
                  Rifiuta
                </Button>
              </div>
            )}

            {appointment.status === 'REQUESTED' && (
              <Button 
                variant="outline"
                onClick={handleCancel}
                className="w-full text-destructive hover:text-destructive"
                disabled={isCancelling}
              >
                Annulla richiesta
              </Button>
            )}

            {appointment.status === 'CONFIRMED' && appointment.canCancel && (
              <Button 
                variant="outline"
                onClick={handleCancel}
                className="w-full text-destructive hover:text-destructive"
                disabled={isCancelling}
              >
                Annulla appuntamento
              </Button>
            )}

            {appointment.status === 'CONFIRMED' && !appointment.canCancel && (
              <p className="text-[15px] leading-6 text-muted-foreground text-center">
                Non è più possibile annullare l'appuntamento
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
