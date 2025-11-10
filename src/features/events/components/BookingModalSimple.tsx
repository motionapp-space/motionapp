import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfDay } from "date-fns";
import { X, Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { useAvailableSlots } from "@/features/bookings/hooks/useAvailableSlots";
import { useCreateEvent } from "../hooks/useCreateEvent";
import { useClientsQuery } from "@/features/clients/hooks/useClientsQuery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar } from "@/components/ui/calendar";
import { RecurrenceSection, type RecurrenceConfig } from "./RecurrenceSection";
import { cn } from "@/lib/utils";
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
  onSelect,
  scrollRef
}: { 
  days: DayAvailability[]; 
  selected: string; 
  onSelect: (isoDate: string) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="relative">
      {/* Left scroll indicator */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent scroll-smooth px-2" 
        role="tablist" 
        aria-label="Scegli un giorno"
      >
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
              className={cn(
                "shrink-0 min-w-[70px] px-3 py-2 rounded-xl border text-sm font-medium transition-all",
                isActive && "bg-primary text-primary-foreground border-primary",
                !isActive && hasSlots && "bg-background text-foreground border-border hover:border-primary/50 hover:bg-accent",
                !hasSlots && "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50"
              )}
            >
              {fmtDay(dt)}
            </button>
          );
        })}
      </div>
      
      {/* Right scroll indicator */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
    </div>
  );
}

function SlotGrid({ 
  slots, 
  onPick,
  isSubmitting,
  selectedSlotId
}: { 
  slots: AvailableSlot[]; 
  onPick: (slot: AvailableSlot) => void;
  isSubmitting: boolean;
  selectedSlotId?: string;
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
        const isSelected = selectedSlotId === slot.start;
        
        return (
          <button
            key={`${slot.start}-${slot.end}`}
            role="option"
            aria-label={`${fmtTime(start)} – ${fmtTime(end)}`}
            aria-selected={isSelected}
            onClick={() => onPick(slot)}
            disabled={isSubmitting}
            className={cn(
              "h-12 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              isSelected 
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:border-primary hover:bg-accent"
            )}
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
  clientId: initialClientId,
  durationMinutes
}: BookingModalSimpleProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [rangeStart, setRangeStart] = useState<Date>(today);
  const [selectedDay, setSelectedDay] = useState<string>(toISODate(today));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const scrollRef = useState<HTMLDivElement | null>(null)[0] as any;

  // Form state
  const [title, setTitle] = useState("Allenamento");
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || "");
  const [location, setLocation] = useState("");
  const [reminderMinutes, setReminderMinutes] = useState<number | undefined>(15);
  const [notes, setNotes] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [recurrenceExpanded, setRecurrenceExpanded] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>({
    enabled: false,
    frequency: "weekly",
    interval: 1,
    weekDays: [],
    monthDay: 1,
    endType: "never",
    endDate: undefined,
    occurrenceCount: 10
  });

  const rangeEnd = useMemo(() => addDays(rangeStart, 13), [rangeStart]);

  const { data: slots = [], isLoading } = useAvailableSlots({
    coachId,
    startDate: rangeStart,
    endDate: rangeEnd,
    enabled: open && !!coachId
  });

  const { data: clientsData } = useClientsQuery({ 
    q: "", 
    status: ["ATTIVO", "POTENZIALE"], 
    page: 1, 
    limit: 100 
  });
  
  const clients = clientsData?.items || [];
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

  const handlePickSlot = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
  };

  const handleSubmit = async () => {
    if (!selectedClientId || !title) {
      return;
    }

    if (!isAllDay && !selectedSlot) {
      return;
    }

    try {
      const basePayload = {
        title,
        client_id: selectedClientId,
        location: location || undefined,
        notes: notes || undefined,
        reminder_offset_minutes: reminderMinutes,
        aligned_to_slot: !isAllDay,
        source: isAllDay ? "manual" as const : "generated" as const,
      };

      if (isAllDay) {
        // Create all-day event (manual, not visible to clients)
        const dayStart = new Date(selectedDay + "T00:00:00");
        const dayEnd = new Date(selectedDay + "T23:59:59");
        
        await createEvent.mutateAsync({
          ...basePayload,
          start_at: dayStart.toISOString(),
          end_at: dayEnd.toISOString(),
          is_all_day: true,
        });
      } else if (selectedSlot) {
        // TODO: Implement recurrence logic when backend is ready
        // For now, create single event
        await createEvent.mutateAsync({
          ...basePayload,
          start_at: selectedSlot.start,
          end_at: selectedSlot.end,
        });
      }

      onOpenChange(false);
    } catch (error) {
      alert("Impossibile creare l'appuntamento. Riprova.");
    }
  };

  const canSubmit = title && selectedClientId && (isAllDay || selectedSlot);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background p-4 md:p-6 shadow-xl border border-border">
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

        {/* Duration & Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <p className="text-sm text-muted-foreground">
            Durata: <span className="font-medium text-foreground">{durationMinutes} min</span> · allineato alla tua disponibilità
          </p>
          <div className="flex gap-2">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Vai a data
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={new Date(selectedDay + "T00:00:00")}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDay(toISODate(date));
                      setCalendarOpen(false);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Day strip navigation */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevRange}
            className="shrink-0"
            aria-label="Settimana precedente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 min-w-0">
            <DayPills 
              days={dayAvailability} 
              selected={selectedDay} 
              onSelect={setSelectedDay}
              scrollRef={scrollRef}
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNextRange}
            className="shrink-0"
            aria-label="Settimana successiva"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={goNextAvailable}
            className="shrink-0 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
          >
            Prossimo disponibile
          </Button>
        </div>

        {/* Date label & All-day toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-foreground">
            {fmtDateLong(new Date(selectedDay + "T00:00:00"))}
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="all-day"
              checked={isAllDay}
              onCheckedChange={setIsAllDay}
            />
            <Label htmlFor="all-day" className="text-sm">
              Giornata intera
            </Label>
          </div>
        </div>

        {/* Slot grid (hidden if all-day) */}
        {!isAllDay && (
          <div className="min-h-[160px] mb-6">
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
                      <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <SlotGrid 
                    slots={selectedDaySlots} 
                    onPick={handlePickSlot}
                    isSubmitting={createEvent.isPending}
                    selectedSlotId={selectedSlot?.start}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* All-day info */}
        {isAllDay && (
          <div className="mb-6 p-3 rounded-xl bg-muted/50 border border-border text-sm text-muted-foreground">
            Evento di giornata intera (non visibile ai clienti)
          </div>
        )}

        {/* Event Details Form */}
        <div className="space-y-4 mb-6 p-4 rounded-xl border border-border bg-muted/20">
          <h3 className="text-sm font-semibold">Dettagli appuntamento</h3>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titolo *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Allenamento, Consulenza"
              required
            />
          </div>

          {/* Client */}
          <div className="space-y-2">
            <Label htmlFor="client">Cliente *</Label>
            <Popover open={clientOpen} onOpenChange={setClientOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between",
                    !selectedClientId && "text-muted-foreground"
                  )}
                >
                  {selectedClientId
                    ? clients.find((c) => c.id === selectedClientId)?.first_name + " " + clients.find((c) => c.id === selectedClientId)?.last_name
                    : "Seleziona cliente"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cerca cliente..." />
                  <CommandList>
                    <CommandEmpty>Nessun cliente trovato.</CommandEmpty>
                    <CommandGroup>
                      {clients.map((client) => (
                        <CommandItem
                          key={client.id}
                          value={`${client.first_name} ${client.last_name}`}
                          onSelect={() => {
                            setSelectedClientId(client.id);
                            setClientOpen(false);
                          }}
                        >
                          {client.first_name} {client.last_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Luogo</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="es. Palestra, Online"
            />
          </div>

          {/* Reminder */}
          <div className="space-y-2">
            <Label htmlFor="reminder">Promemoria</Label>
            <Select
              value={reminderMinutes?.toString() || "none"}
              onValueChange={(value) => setReminderMinutes(value === "none" ? undefined : parseInt(value))}
            >
              <SelectTrigger id="reminder">
                <SelectValue placeholder="Nessuno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nessuno</SelectItem>
                <SelectItem value="15">15 minuti prima</SelectItem>
                <SelectItem value="30">30 minuti prima</SelectItem>
                <SelectItem value="60">1 ora prima</SelectItem>
                <SelectItem value="1440">1 giorno prima</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes (Collapsible) */}
          <Collapsible open={notesExpanded} onOpenChange={setNotesExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <ChevronDown className={cn("h-4 w-4 mr-2 transition-transform", notesExpanded && "rotate-180")} />
                Aggiungi note
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note sull'appuntamento..."
                rows={3}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Recurrence Section (Collapsible) */}
        <Collapsible open={recurrenceExpanded} onOpenChange={setRecurrenceExpanded} className="mb-6">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start mb-2">
              <ChevronDown className={cn("h-4 w-4 mr-2 transition-transform", recurrenceExpanded && "rotate-180")} />
              🔁 Ripete ogni... 
              <span className="ml-2 text-xs text-muted-foreground">
                Pianifica più appuntamenti automaticamente
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 rounded-xl border border-border bg-muted/20">
              <RecurrenceSection
                config={recurrence}
                onChange={setRecurrence}
                startDate={selectedSlot ? new Date(selectedSlot.start) : new Date(selectedDay + "T09:00:00")}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button 
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annulla
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!canSubmit || createEvent.isPending}
          >
            {createEvent.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creazione...
              </>
            ) : (
              "Crea appuntamento"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
