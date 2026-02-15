import { useState, useMemo } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAvailableSlots } from "@/features/bookings/hooks/useAvailableSlots";
import { cn } from "@/lib/utils";
import type { AvailableSlot } from "@/features/bookings/types";
import { WeeklyDateStrip } from "./WeeklyDateStrip";
import { SlotFilters, type TimeOfDay } from "./SlotFilters";
import { SlotGrid } from "./SlotGrid";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

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
  const [timeFilter, setTimeFilter] = useState<TimeOfDay>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const dayStart = startOfDay(selectedDate);
  const dayEnd = addDays(dayStart, 1);

  const { data: slots = [], isLoading, error } = useAvailableSlots({
    coachId,
    startDate: dayStart,
    endDate: dayEnd,
    enabled: !!coachId,
  });

  // Filter slots by time of day
  const filteredSlots = useMemo(() => {
    if (!timeFilter) return slots;

    return slots.filter(slot => {
      const hour = new Date(slot.start).getHours();
      
      switch (timeFilter) {
        case "morning":
          return hour >= 6 && hour < 12;
        case "afternoon":
          return hour >= 12 && hour < 18;
        case "evening":
          return hour >= 18 && hour < 23;
        default:
          return true;
      }
    });
  }, [slots, timeFilter]);

  // Calculate slot counts for the weekly strip (simplified - could be enhanced with API)
  const slotCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    counts[dateKey] = slots.length;
    return counts;
  }, [selectedDate, slots.length]);

  // Find next available slot
  const findNextAvailableSlot = () => {
    if (filteredSlots.length > 0) {
      onSlotSelect(filteredSlots[0]);
      return;
    }
    
    // In a real implementation, this would query the API for the next available slot
    // For now, just move to the next day
    onDateChange(addDays(selectedDate, 1));
  };

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Scegli un giorno</h3>
          <div className="flex gap-2">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Vai a data
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      onDateChange(date);
                      setCalendarOpen(false);
                    }
                  }}
                  locale={it}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-3"
              onClick={findNextAvailableSlot}
            >
              <ChevronRight className="h-4 w-4 mr-2" />
              Prossimo disponibile
            </Button>
          </div>
        </div>

        <WeeklyDateStrip
          selectedDate={selectedDate}
          onDateSelect={onDateChange}
          slotCounts={slotCounts}
        />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Filtra per orario</h3>
        <SlotFilters
          selectedTimeOfDay={timeFilter}
          onTimeOfDayChange={setTimeFilter}
        />
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Errore nel caricamento degli slot disponibili
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State with Suggestions */}
      {!isLoading && !error && filteredSlots.length === 0 && slots.length === 0 && (
        <Alert>
          <AlertDescription>
            <div className="space-y-3">
              <p className="font-medium">
                Nessuno slot disponibile per {format(selectedDate, "EEEE d MMMM", { locale: it })}.
              </p>
              <p className="text-sm">Prova questi orari disponibili:</p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((days) => {
                  const nextDate = addDays(selectedDate, days);
                  return (
                    <Button
                      key={days}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onDateChange(nextDate)}
                    >
                      {format(nextDate, "EEE d MMM", { locale: it })}
                    </Button>
                  );
                })}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Filtered Empty State */}
      {!isLoading && !error && filteredSlots.length === 0 && slots.length > 0 && (
        <Alert>
          <AlertDescription>
            Nessuno slot trovato per il filtro selezionato. 
            Prova a modificare i filtri o seleziona "Tutti".
          </AlertDescription>
        </Alert>
      )}

      {/* Slot Grid */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Slot disponibili ({filteredSlots.length})
        </h3>
        <SlotGrid
          slots={filteredSlots}
          selectedSlot={selectedSlot}
          onSlotSelect={onSlotSelect}
          isLoading={isLoading}
        />
      </div>

      {/* Selected Slot Confirmation */}
      {selectedSlot && (
        <Alert className="bg-success/10 border-success/40">
          <AlertDescription className="text-foreground text-sm">
            Appuntamento nello slot{" "}
            <span className="font-semibold">
              {format(new Date(selectedSlot.start), "HH:mm")}–
              {format(new Date(selectedSlot.end), "HH:mm")}
            </span>{" "}
            ({duration} min)
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
