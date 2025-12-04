import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addDays, startOfDay, isSameDay, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { useClientAvailableSlots } from "../hooks/useClientAvailableSlots";
import { useCreateBookingRequest } from "../hooks/useCreateBookingRequest";
import type { AvailableSlot } from "../types";

interface SlotSelectorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SlotSelectorSheet({ open, onOpenChange }: SlotSelectorSheetProps) {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const { data: slots, isLoading } = useClientAvailableSlots(28);
  const createBooking = useCreateBookingRequest();

  // Generate week of dates starting from selectedDate's week start
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    const today = startOfDay(new Date());
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(today, i + Math.floor((selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7)) * 7));
    }
    return dates;
  }, [selectedDate]);

  // Filter slots for selected date
  const daySlots = useMemo(() => {
    if (!slots) return [];
    return slots.filter(slot => 
      isSameDay(parseISO(slot.start), selectedDate)
    );
  }, [slots, selectedDate]);

  const handleSelectSlot = async (slot: AvailableSlot) => {
    await createBooking.mutateAsync({
      requestedStartAt: slot.start,
      requestedEndAt: slot.end
    });
    onOpenChange(false);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = direction === 'next' ? 7 : -7;
    const newDate = addDays(selectedDate, days);
    const today = startOfDay(new Date());
    if (newDate >= today) {
      setSelectedDate(newDate);
    }
  };

  const canGoPrev = selectedDate > startOfDay(new Date());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Seleziona data e orario</SheetTitle>
        </SheetHeader>

        {/* Week navigator */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigateWeek('prev')}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium">
            {format(weekDates[0], "d MMM", { locale: it })} - {format(weekDates[6], "d MMM", { locale: it })}
          </span>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigateWeek('next')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Date strip */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {weekDates.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            const hasSlots = slots?.some(s => isSameDay(parseISO(s.start), date));
            
            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 flex flex-col items-center p-2 rounded-lg min-w-[60px] transition-colors ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : hasSlots 
                      ? 'bg-accent hover:bg-accent/80' 
                      : 'opacity-50'
                }`}
              >
                <span className="text-xs uppercase">
                  {format(date, "EEE", { locale: it })}
                </span>
                <span className="text-lg font-semibold">
                  {format(date, "d")}
                </span>
              </button>
            );
          })}
        </div>

        {/* Slots grid */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Orari disponibili per {format(selectedDate, "EEEE d MMMM", { locale: it })}
          </h3>

          {isLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : daySlots.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nessun orario disponibile per questa data
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {daySlots.map((slot) => (
                <Button
                  key={slot.start}
                  variant="outline"
                  className="h-12"
                  onClick={() => handleSelectSlot(slot)}
                  disabled={createBooking.isPending}
                >
                  {format(parseISO(slot.start), "HH:mm")}
                </Button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
