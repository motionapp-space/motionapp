import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfDay } from "date-fns";
import { X, Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, Repeat } from "lucide-react";
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
      {/* Left gradient indicator */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background via-background/80 to-transparent pointer-events-none z-10" />
      
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth px-1" 
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
                "shrink-0 min-w-[80px] px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive && "bg-primary text-primary-foreground shadow-sm",
                !isActive && hasSlots && "bg-background text-foreground hover:bg-primary/10 hover:shadow-sm border border-border",
                !hasSlots && "bg-muted text-muted-foreground cursor-not-allowed opacity-40"
              )}
            >
              {fmtDay(dt)}
            </button>
          );
        })}
      </div>
      
      {/* Right gradient indicator */}
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none z-10" />
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
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">Nessuno slot disponibile per questo giorno</p>
        <p className="text-xs text-muted-foreground/70">Prova un altro giorno o usa "Prossimo disponibile"</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2" role="listbox" aria-label="Slot orari disponibili">
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
              "h-11 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1",
              isSelected 
                ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                : "bg-background text-foreground hover:bg-primary/10 hover:shadow-sm border border-border/50"
            )}
          >
            {fmtTime(start)}–{fmtTime(end)}
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
  const scrollRef = useRef<HTMLDivElement>(null);

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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-background shadow-2xl border border-border/50"
      >
        {/* Header with Title & Client */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 p-6 pb-4 z-10">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Nuovo appuntamento</h2>
            <button 
              onClick={() => onOpenChange(false)} 
              className="p-2 rounded-full hover:bg-accent/50 transition-colors" 
              aria-label="Chiudi"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Primary fields: Title & Client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-medium text-muted-foreground">Titolo *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="es. Allenamento, Consulenza"
                className="h-11 text-base border-border/50 focus:border-primary"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client" className="text-xs font-medium text-muted-foreground">Cliente *</Label>
              <Popover open={clientOpen} onOpenChange={setClientOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full h-11 justify-between border-border/50 hover:border-primary/50",
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
          </div>

          <p className="text-xs text-muted-foreground">
            Durata: <span className="font-medium text-foreground">{durationMinutes} min</span> · allineato alla tua disponibilità
          </p>
        </div>

        {/* Main Content */}
        <div className="p-6 pt-4 space-y-6">
          {/* Day Selection & Navigation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground/90">Seleziona giorno e orario</h3>
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevRange}
                  className="h-8 w-8 shrink-0"
                  aria-label="Settimana precedente"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                      <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
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

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNextRange}
                  className="h-8 w-8 shrink-0"
                  aria-label="Settimana successiva"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goNextAvailable}
                  className="h-8 text-xs bg-primary/5 text-primary hover:bg-primary/10"
                >
                  Prossimo disponibile
                </Button>
              </div>
            </div>

            <DayPills 
              days={dayAvailability} 
              selected={selectedDay} 
              onSelect={setSelectedDay}
              scrollRef={scrollRef}
            />
          </div>

          {/* Selected Date & All-day toggle */}
          <div className="flex items-center justify-between py-2">
            <h4 className="text-base font-medium">
              {fmtDateLong(new Date(selectedDay + "T00:00:00"))}
            </h4>
            <div className="flex items-center gap-2">
              <Switch
                id="all-day"
                checked={isAllDay}
                onCheckedChange={setIsAllDay}
              />
              <Label htmlFor="all-day" className="text-sm cursor-pointer">
                Giornata intera
              </Label>
            </div>
          </div>

          {/* Slot grid (hidden if all-day) */}
          {!isAllDay && (
            <div className="min-h-[140px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedDay}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-11 rounded-xl bg-muted/50 animate-pulse" />
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
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Evento di giornata intera <span className="text-muted-foreground/70">(non visibile ai clienti)</span>
              </p>
            </div>
          )}

          {/* Event Details - Minimal Layout */}
          <div className="space-y-4 pt-4 border-t border-border/30">
            <h3 className="text-sm font-semibold text-foreground/80">Dettagli opzionali</h3>

            {/* Location */}
            <div className="flex items-center gap-3">
              <Label htmlFor="location" className="text-sm text-muted-foreground min-w-[80px]">Luogo</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="es. Palestra, Online"
                className="flex-1 h-9 border-0 border-b border-border/50 rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
              />
            </div>

            {/* Reminder */}
            <div className="flex items-center gap-3">
              <Label htmlFor="reminder" className="text-sm text-muted-foreground min-w-[80px]">Promemoria</Label>
              <Select
                value={reminderMinutes?.toString() || "none"}
                onValueChange={(value) => setReminderMinutes(value === "none" ? undefined : parseInt(value))}
              >
                <SelectTrigger id="reminder" className="flex-1 h-9 border-0 border-b border-border/50 rounded-none focus:ring-0 px-0">
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
                <Button variant="ghost" size="sm" className="h-8 -ml-2 text-sm text-muted-foreground hover:text-foreground">
                  <ChevronDown className={cn("h-3.5 w-3.5 mr-1.5 transition-transform", notesExpanded && "rotate-180")} />
                  Aggiungi note
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Note sull'appuntamento..."
                  className="min-h-[80px] resize-none border-border/50"
                  rows={3}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Recurrence Section (Simplified) */}
          <div className="pt-4 border-t border-border/30">
            <Collapsible open={recurrenceExpanded} onOpenChange={setRecurrenceExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 -ml-2 text-sm text-muted-foreground hover:text-foreground mb-2">
                  <Repeat className="h-3.5 w-3.5 mr-1.5" />
                  Ripete ogni...
                  <ChevronDown className={cn("h-3.5 w-3.5 ml-1.5 transition-transform", recurrenceExpanded && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-2"
                >
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                    <RecurrenceSection
                      config={recurrence}
                      onChange={setRecurrence}
                      startDate={selectedSlot ? new Date(selectedSlot.start) : new Date(selectedDay + "T09:00:00")}
                    />
                    <p className="text-xs text-muted-foreground/70 mt-3 leading-relaxed">
                      ℹ️ Gli appuntamenti ricorrenti seguiranno la tua disponibilità. Se uno slot non è disponibile, verrà saltato.
                    </p>
                  </div>
                </motion.div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/50 p-6 pt-4">
          <div className="flex justify-end gap-3">
            <Button 
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="px-6"
            >
              Annulla
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!canSubmit || createEvent.isPending}
              className="px-6 shadow-sm"
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
      </motion.div>
    </div>
  );
}
