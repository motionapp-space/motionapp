import { useState } from "react";
import { format, parseISO, startOfWeek, addDays, addWeeks } from "date-fns";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvailableSlots } from "../hooks/useAvailableSlots";
import { formatSlot } from "../utils/slot-generator";
import type { AvailableSlot } from "../types";

interface ClientBookingViewProps {
  coachId: string;
  onSlotSelect: (slot: AvailableSlot) => void;
}

/**
 * Mobile-first interface for clients to view and select available booking slots.
 * Shows only available slots with no indication of unavailable times or buffers.
 */
export function ClientBookingView({ coachId, onSlotSelect }: ClientBookingViewProps) {
  const [selectedWeekStart, setSelectedWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekEnd = addDays(selectedWeekStart, 6);

  const { data: slots, isLoading } = useAvailableSlots({
    coachId,
    startDate: selectedWeekStart,
    endDate: weekEnd,
    enabled: true,
  });

  // Group slots by day
  const slotsByDay = slots?.reduce((acc, slot) => {
    const date = format(parseISO(slot.start), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, AvailableSlot[]>);

  const handlePreviousWeek = () => {
    setSelectedWeekStart((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setSelectedWeekStart((prev) => addDays(prev, 7));
  };

  const handleToday = () => {
    setSelectedWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with week navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Prenota una sessione
              </CardTitle>
              <CardDescription>
                Seleziona uno slot disponibile
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <p className="text-sm font-medium">
                {format(selectedWeekStart, "d MMM", { locale: it })} -{" "}
                {format(weekEnd, "d MMM yyyy", { locale: it })}
              </p>
            </div>

            <Button variant="outline" size="sm" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="w-full mt-2"
          >
            Oggi
          </Button>
        </CardHeader>
      </Card>

      {/* Slots list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <div className="grid gap-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))
        ) : !slots || slots.length === 0 ? (
          // No slots available
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Nessuno slot disponibile in questa settimana
              </p>
            </CardContent>
          </Card>
        ) : (
          // Render slots grouped by day
          Array.from({ length: 7 }).map((_, dayIndex) => {
            const currentDay = addDays(selectedWeekStart, dayIndex);
            const dayKey = format(currentDay, "yyyy-MM-dd");
            const daySlots = slotsByDay?.[dayKey] || [];

            if (daySlots.length === 0) return null;

            return (
              <div key={dayKey} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">
                    {format(currentDay, "EEEE d MMMM", { locale: it })}
                  </h3>
                  <Badge variant="secondary">{daySlots.length}</Badge>
                </div>

                <div className="grid gap-2">
                  {daySlots.map((slot, index) => (
                    <Button
                      key={`${slot.start}-${index}`}
                      variant="outline"
                      className="h-auto justify-start p-4 hover:bg-primary/5 hover:border-primary"
                      onClick={() => onSlotSelect(slot)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{formatSlot(slot)}</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round(
                              (parseISO(slot.end).getTime() -
                                parseISO(slot.start).getTime()) /
                                (1000 * 60)
                            )}{" "}
                            minuti
                          </p>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
