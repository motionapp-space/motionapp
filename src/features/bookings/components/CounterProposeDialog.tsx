import { useState, useMemo } from "react";
import { format, addHours, startOfDay, addDays } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar, Clock, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { BookingRequestWithClient } from "../types";

interface CounterProposeDialogProps {
  request: BookingRequestWithClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, startAt: string, endAt: string) => void;
  isSubmitting?: boolean;
}

// Genera slot orari per una data (es. 07:00 - 21:00 ogni 30 min)
function generateTimeSlots(date: Date, slotDurationMinutes: number = 60) {
  const slots: { start: Date; end: Date; label: string }[] = [];
  const dayStart = startOfDay(date);
  
  for (let hour = 7; hour < 21; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const start = new Date(dayStart);
      start.setHours(hour, min, 0, 0);
      const end = new Date(start.getTime() + slotDurationMinutes * 60000);
      
      if (end.getHours() <= 21) {
        slots.push({
          start,
          end,
          label: `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`,
        });
      }
    }
  }
  
  return slots;
}

export function CounterProposeDialog({
  request,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: CounterProposeDialogProps) {
  const originalStart = request ? new Date(request.requested_start_at) : new Date();
  const originalEnd = request ? new Date(request.requested_end_at) : new Date();
  const durationMinutes = Math.round((originalEnd.getTime() - originalStart.getTime()) / 60000);

  const [selectedDate, setSelectedDate] = useState<Date>(originalStart);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

  const timeSlots = useMemo(() => {
    return generateTimeSlots(selectedDate, durationMinutes);
  }, [selectedDate, durationMinutes]);

  const handleSubmit = () => {
    if (!request || !selectedSlot) return;
    onSubmit(request.id, selectedSlot.start.toISOString(), selectedSlot.end.toISOString());
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setSelectedSlot(null);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Proponi nuovo orario</DialogTitle>
          <DialogDescription>
            Seleziona una data e un orario alternativo per {request.client_name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Info richiesta originale */}
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Richiesta originale:</span>
            </div>
            <p className="font-medium text-foreground mt-1">
              {format(originalStart, "EEEE d MMMM, HH:mm", { locale: it })} – {format(originalEnd, "HH:mm")}
            </p>
          </div>

          {/* Selettore data */}
          <div className="flex justify-center">
            <CalendarPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < startOfDay(new Date())}
              className="rounded-md border pointer-events-auto"
              locale={it}
            />
          </div>

          {/* Slot orari */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Clock className="h-4 w-4" />
              <span>Orari disponibili per {format(selectedDate, "d MMMM", { locale: it })}</span>
            </div>
            <ScrollArea className="h-40">
              <div className="grid grid-cols-3 gap-2 pr-4">
                {timeSlots.map((slot, idx) => (
                  <Button
                    key={idx}
                    variant={selectedSlot?.start.getTime() === slot.start.getTime() ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "text-xs",
                      selectedSlot?.start.getTime() === slot.start.getTime() && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot.label}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedSlot || isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Invia proposta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
