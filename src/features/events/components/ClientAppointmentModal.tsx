// FASE 4: Client Appointment Modal - Vincoli hard
// Mantiene la logica attuale di UnifiedAppointmentModal per i clienti

import { useState, useEffect, useMemo } from "react";
import { format, parse, addMinutes, addDays } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { useCreateEvent } from "../hooks/useCreateEvent";
import { useAvailableSlots } from "@/features/bookings/hooks/useAvailableSlots";
import { getAvailableSlots } from "@/features/bookings/api/available-slots.api";
import { getCoachClientId } from "@/lib/coach-client";

interface ClientAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachId: string;
  clientId: string;
  durationMinutes: number;
}

export function ClientAppointmentModal({
  open,
  onOpenChange,
  coachId,
  clientId,
  durationMinutes = 45,
}: ClientAppointmentModalProps) {
  const [rangeStart, setRangeStart] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);

  const rangeEnd = useMemo(() => addDays(rangeStart, 14), [rangeStart]);

  const { data: slots = [], isLoading } = useAvailableSlots({
    coachId,
    startDate: rangeStart,
    endDate: rangeEnd,
    enabled: open && !!coachId,
    calendarMode: 'client',
  });

  const createEvent = useCreateEvent();

  // Auto-search for first available slot if none found in current range
  useEffect(() => {
    if (!open || isLoading || isSearching || slots.length > 0) return;

    const searchForSlots = async () => {
      setIsSearching(true);
      let searchStart = new Date();
      let daysSearched = 0;
      const maxSearchDays = 90;

      while (daysSearched < maxSearchDays) {
        const searchEnd = addDays(searchStart, 14);

        try {
          const response = await getAvailableSlots({
            coachId,
            startDate: searchStart.toISOString(),
            endDate: searchEnd.toISOString(),
            calendarMode: 'client',
          });

          if (response.length > 0) {
            setRangeStart(searchStart);
            setIsSearching(false);
            return;
          }
        } catch (error) {
          console.error("Error searching slots:", error);
          break;
        }

        searchStart = addDays(searchStart, 14);
        daysSearched += 14;
      }

      setIsSearching(false);
    };

    searchForSlots();
  }, [open, slots.length, isLoading, coachId, isSearching]);

  const handleNext = () => {
    setRangeStart(addDays(rangeStart, 14));
    setSelectedSlot("");
  };

  const handlePrev = () => {
    const newStart = addDays(rangeStart, -14);
    if (newStart >= new Date()) {
      setRangeStart(newStart);
      setSelectedSlot("");
    }
  };

  const handleConfirm = async () => {
    if (!selectedSlot) return;

    const slotStart = new Date(selectedSlot);
    const slotEnd = addMinutes(slotStart, durationMinutes);

    // Get coach_client_id
    const coachClientId = await getCoachClientId(clientId);

    await createEvent.mutateAsync({
      coach_client_id: coachClientId,
      title: "Appuntamento",
      start_at: slotStart.toISOString(),
      end_at: slotEnd.toISOString(),
      source: 'client',
      aligned_to_slot: true,
    });

    onOpenChange(false);
  };

  // Group slots by day
  const slotsByDay = useMemo(() => {
    const grouped: Record<string, typeof slots> = {};
    slots.forEach((slot) => {
      const day = format(new Date(slot.start), "yyyy-MM-dd");
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(slot);
    });
    return grouped;
  }, [slots]);

  const canGoBack = rangeStart > new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Prenota un appuntamento</DialogTitle>
        </DialogHeader>

        {(isLoading || isSearching) && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">
              {isSearching ? "Ricerca slot disponibili..." : "Caricamento..."}
            </span>
          </div>
        )}

        {!isLoading && !isSearching && slots.length === 0 && (
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              Al momento non ci sono orari disponibili da prenotare. Contatta il tuo trainer per concordare un appuntamento.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !isSearching && slots.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={!canGoBack}
              >
                ← Precedente
              </Button>
              <span className="text-sm font-medium">
                {format(rangeStart, "d MMM")} - {format(rangeEnd, "d MMM yyyy")}
              </span>
              <Button variant="outline" onClick={handleNext}>
                Successivo →
              </Button>
            </div>

            <RadioGroup value={selectedSlot} onValueChange={setSelectedSlot}>
              {Object.entries(slotsByDay).map(([day, daySlots]) => (
                <div key={day} className="space-y-2">
                  <div className="font-medium text-sm text-muted-foreground sticky top-0 bg-background py-2">
                    {format(new Date(day), "EEEE d MMMM")}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {daySlots.map((slot) => (
                      <div key={slot.start} className="flex items-center">
                        <RadioGroupItem
                          value={slot.start}
                          id={slot.start}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={slot.start}
                          className="flex flex-1 items-center justify-center rounded-md border-2 border-muted bg-background px-3 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-sm"
                        >
                          <Clock className="mr-2 h-3 w-3" />
                          {format(new Date(slot.start), "HH:mm")}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSlot || createEvent.isPending}
          >
            Conferma prenotazione
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
