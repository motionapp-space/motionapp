import { useState } from "react";
import { format, addDays, subDays, startOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAvailableSlots } from "@/features/bookings/hooks/useAvailableSlots";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { AvailableSlot } from "@/features/bookings/types";

interface SlotSelectorProps {
  coachId: string;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedSlot: AvailableSlot | null;
  onSlotSelect: (slot: AvailableSlot) => void;
  duration: number;
}

export function SlotSelector({ 
  coachId, 
  selectedDate, 
  onDateChange, 
  selectedSlot, 
  onSlotSelect,
  duration 
}: SlotSelectorProps) {
  const dayStart = startOfDay(selectedDate);
  const dayEnd = addDays(dayStart, 1);

  const { data: slots = [], isLoading, error } = useAvailableSlots({
    coachId,
    startDate: dayStart,
    endDate: dayEnd,
    enabled: !!coachId,
  });

  const handlePreviousDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  const isSlotSelected = (slot: AvailableSlot) => {
    if (!selectedSlot) return false;
    return slot.start === selectedSlot.start && slot.end === selectedSlot.end;
  };

  const formatSlotTime = (slot: AvailableSlot) => {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    return `${format(start, "HH:mm")}–${format(end, "HH:mm")}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePreviousDay}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Giorno precedente
        </Button>
        
        <div className="text-sm font-medium">
          {format(selectedDate, "EEEE d MMMM yyyy", { locale: it })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleNextDay}
          className="flex items-center gap-1"
        >
          Giorno successivo
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Errore nel caricamento degli slot disponibili
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && slots.length === 0 && (
        <Alert>
          <AlertDescription>
            Nessuno slot disponibile in questa giornata. Seleziona un'altra data o crea un orario personalizzato.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && slots.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {slots.map((slot, index) => (
            <Button
              key={`${slot.start}-${index}`}
              type="button"
              variant={isSlotSelected(slot) ? "default" : "outline"}
              className={cn(
                "h-auto py-3 px-4 text-sm font-normal transition-all",
                isSlotSelected(slot) && "ring-2 ring-primary ring-offset-2"
              )}
              onClick={() => onSlotSelect(slot)}
            >
              {formatSlotTime(slot)}
            </Button>
          ))}
        </div>
      )}

      {selectedSlot && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-700 text-sm">
            Appuntamento creato nello slot {formatSlotTime(selectedSlot)} ({duration} min)
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
