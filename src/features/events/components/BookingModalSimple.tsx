import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfDay } from "date-fns";
import { X, Loader2 } from "lucide-react";
import { useAvailableSlots } from "@/features/bookings/hooks/useAvailableSlots";
import { useCreateEvent } from "../hooks/useCreateEvent";
import type { AvailableSlot } from "@/features/bookings/types";

interface DayAvailability {
  date: string;
  slots: AvailableSlot[];
}

interface BookingModalSimpleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachId: string;
  clientId?: string;
  durationMinutes: number;
}

const fmtDay = (d: Date) => d.toLocaleDateString("it-IT", { weekday: "short", day: "2-digit" });
const fmtDateLong = (d: Date) => d.toLocaleDateString("it-IT", { weekday: "long", month: "long", day: "numeric" });
const fmtTime = (d: Date) => d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
const toISODate = (d: Date) => format(d, "yyyy-MM-dd");

function DayPills({ 
  days, 
  selected, 
  onSelect 
}: { 
  days: DayAvailability[]; 
  selected: string; 
  onSelect: (isoDate: string) => void; 
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent" role="tablist" aria-label="Scegli un giorno">
      {days.map((d) => {
        const hasSlots = d.slots.length > 0;
        const dt = new Date(d.date + "T00:00:00");
        const isActive = selected === d.date;
        
        return (
          <button
            key={d.date}
            role="tab"
            aria-selected={isActive}
            onClick={() => hasSlots && onSelect(d.date)}
            disabled={!hasSlots}
            className={`shrink-0 min-w-[70px] px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
              isActive 
                ? "bg-primary text-primary-foreground border-primary" 
                : hasSlots 
                  ? "bg-background text-foreground border-border hover:border-primary/50 hover:bg-accent" 
                  : "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50"
            }`}
          >
            {fmtDay(dt)}
          </button>
        );
      })}
    </div>
  );
}

function SlotGrid({ 
  slots, 
  onPick,
  isSubmitting 
}: { 
  slots: AvailableSlot[]; 
  onPick: (slot: AvailableSlot) => void;
  isSubmitting: boolean;
}) {
  if (!slots.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nessuno slot disponibile per questo giorno
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2" role="listbox" aria-label="Slot orari disponibili">
      {slots.map((slot) => {
        const start = new Date(slot.start);
        const end = new Date(slot.end);
        
        return (
          <button
            key={`${slot.start}-${slot.end}`}
            role="option"
            aria-label={`${fmtTime(start)} – ${fmtTime(end)}`}
            onClick={() => onPick(slot)}
            disabled={isSubmitting}
            className="h-12 rounded-lg border border-border hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-sm font-medium bg-background hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {fmtTime(start)} – {fmtTime(end)}
          </button>
        );
      })}
    </div>
  );
}

export function BookingModalSimple({
  open,
  onOpenChange,
  coachId,
  clientId,
  durationMinutes
}: BookingModalSimpleProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [rangeStart, setRangeStart] = useState<Date>(today);
  const [selectedDay, setSelectedDay] = useState<string>(toISODate(today));

  const rangeEnd = useMemo(() => addDays(rangeStart, 13), [rangeStart]);

  const { data: slots = [], isLoading } = useAvailableSlots({
    coachId,
    startDate: rangeStart,
    endDate: rangeEnd,
    enabled: open && !!coachId
  });

  const createEvent = useCreateEvent();

  // Group slots by day
  const dayAvailability = useMemo(() => {
    const grouped = new Map<string, AvailableSlot[]>();
    
    slots.forEach(slot => {
      const date = toISODate(new Date(slot.start));
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(slot);
    });

    const days: DayAvailability[] = [];
    for (let i = 0; i < 14; i++) {
      const date = toISODate(addDays(rangeStart, i));
      days.push({
        date,
        slots: grouped.get(date) || []
      });
    }

    return days;
  }, [slots, rangeStart]);

  const selectedDaySlots = useMemo(() => 
    dayAvailability.find(d => d.date === selectedDay)?.slots ?? [],
    [dayAvailability, selectedDay]
  );

  // Auto-select first day with slots when range changes
  useEffect(() => {
    if (dayAvailability.length > 0) {
      const currentDayExists = dayAvailability.some(d => d.date === selectedDay);
      if (!currentDayExists) {
        const firstWithSlots = dayAvailability.find(d => d.slots.length > 0);
        if (firstWithSlots) {
          setSelectedDay(firstWithSlots.date);
        } else {
          setSelectedDay(dayAvailability[0].date);
        }
      }
    }
  }, [dayAvailability, selectedDay]);

  const goToPrevRange = () => {
    setRangeStart(prev => addDays(prev, -14));
  };

  const goToNextRange = () => {
    setRangeStart(prev => addDays(prev, 14));
  };

  const goNextAvailable = () => {
    const currentIndex = dayAvailability.findIndex(d => d.date === selectedDay);
    const nextWithSlots = dayAvailability.slice(currentIndex + 1).find(d => d.slots.length > 0);
    
    if (nextWithSlots) {
      setSelectedDay(nextWithSlots.date);
    } else {
      // Load next range and select first day with slots
      goToNextRange();
    }
  };

  const handlePickSlot = async (slot: AvailableSlot) => {
    if (!clientId) {
      alert("Seleziona un cliente prima di prenotare");
      return;
    }

    try {
      await createEvent.mutateAsync({
        title: "Allenamento",
        client_id: clientId,
        start_at: slot.start,
        end_at: slot.end,
        aligned_to_slot: true,
        source: "generated"
      });
      onOpenChange(false);
    } catch (error) {
      alert("Questo slot è appena stato prenotato. Scegline un altro.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-background p-4 md:p-6 shadow-xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-semibold">Nuovo appuntamento</h2>
          <button 
            onClick={() => onOpenChange(false)} 
            className="p-2 rounded-full hover:bg-accent transition-colors" 
            aria-label="Chiudi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Duration hint */}
        <p className="mb-4 text-sm text-muted-foreground">
          Durata: <span className="font-medium text-foreground">{durationMinutes} min</span> · allineato alla tua disponibilità
        </p>

        {/* Navigation row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
          <div className="flex-1 w-full overflow-hidden">
            <DayPills days={dayAvailability} selected={selectedDay} onSelect={setSelectedDay} />
          </div>
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={goToPrevRange} 
              className="px-3 py-2 rounded-lg border border-border hover:bg-accent text-sm transition-colors"
              aria-label="Settimana precedente"
            >
              ◀
            </button>
            <button 
              onClick={goToNextRange} 
              className="px-3 py-2 rounded-lg border border-border hover:bg-accent text-sm transition-colors"
              aria-label="Settimana successiva"
            >
              ▶
            </button>
            <button 
              onClick={goNextAvailable} 
              className="px-3 py-2 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium transition-colors whitespace-nowrap"
            >
              Prossimo disponibile
            </button>
          </div>
        </div>

        {/* Date label */}
        <div className="mb-3 text-sm font-medium text-foreground">
          {fmtDateLong(new Date(selectedDay + "T00:00:00"))}
        </div>

        {/* Slot grid with animation */}
        <div className="min-h-[200px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDay}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <SlotGrid 
                  slots={selectedDaySlots} 
                  onPick={handlePickSlot}
                  isSubmitting={createEvent.isPending}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-2">
          <button 
            onClick={() => onOpenChange(false)} 
            className="px-4 h-10 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            Annulla
          </button>
        </div>

        {/* Loading overlay */}
        {createEvent.isPending && (
          <div className="absolute inset-0 grid place-items-center bg-background/60 rounded-2xl backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
