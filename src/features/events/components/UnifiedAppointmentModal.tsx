import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfDay, setHours, setMinutes } from "date-fns";
import { X, Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, Repeat, AlertCircle, Play } from "lucide-react";
import { useAvailableSlots } from "@/features/bookings/hooks/useAvailableSlots";
import { getAvailableSlots } from "@/features/bookings/api/available-slots.api";
import { useCreateEvent } from "../hooks/useCreateEvent";
import { useUpdateEvent } from "../hooks/useUpdateEvent";
import { useClientsQuery } from "@/features/clients/hooks/useClientsQuery";
import { useClientPackages } from "@/features/packages/hooks/useClientPackages";
import { calculatePackageKPI } from "@/features/packages/utils/kpi";
import { logClientActivity } from "@/features/clients/api/activities.api";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RecurrenceSection, type RecurrenceConfig } from "./RecurrenceSection";
import { generateRecurrenceOccurrences } from "../utils/recurrence";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AvailableSlot } from "@/features/bookings/types";
import type { EventWithClient } from "../types";

interface DayAvailability {
  date: string;
  slots: AvailableSlot[];
}

interface UnifiedAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachId: string;
  clientId?: string;
  lockedClientId?: string;
  durationMinutes: number;
  event?: EventWithClient;
  onStartSession?: (clientId: string, eventId: string, linkedPlanId?: string, linkedDayId?: string) => void;
  mode?: 'coach-create' | 'client-booking';
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

export function UnifiedAppointmentModal({
  open,
  onOpenChange,
  coachId,
  clientId: initialClientId,
  lockedClientId,
  durationMinutes,
  event,
  onStartSession,
  mode = 'client-booking'
}: UnifiedAppointmentModalProps) {
  const isEditMode = !!event;
  const isCoachMode = mode === 'coach-create';
  const today = useMemo(() => startOfDay(new Date()), []);
  const [rangeStart, setRangeStart] = useState<Date>(today);
  const [selectedDay, setSelectedDay] = useState<string>(toISODate(today));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Form state
  const [title, setTitle] = useState("Allenamento");
  const [selectedClientId, setSelectedClientId] = useState(lockedClientId || initialClientId || "");
  const [location, setLocation] = useState("");
  const [reminderMinutes, setReminderMinutes] = useState<number | undefined>(15);
  const [notes, setNotes] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [notesExpanded, setNotesExpanded] = useState(false);
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

  const canStartSession = isEditMode && !!event && !!selectedClientId && !!onStartSession;

  // Initialize form with event data in edit mode
  useEffect(() => {
    if (event && open) {
      setTitle(event.title || "Allenamento");
      setSelectedClientId(event.client_id);
      setLocation(event.location || "");
      setReminderMinutes(event.reminder_offset_minutes || undefined);
      setNotes(event.notes || "");
      setIsAllDay(event.is_all_day || false);
      setNotesExpanded(!!event.notes);
      
      // Set selected day and slot for edit mode
      const eventStart = new Date(event.start_at);
      setSelectedDay(toISODate(eventStart));
      setRangeStart(startOfDay(eventStart));
      
      if (!event.is_all_day) {
        setSelectedSlot({
          start: event.start_at,
          end: event.end_at
        });
      }
    } else if (!event && open) {
      // Reset for new appointment
      setTitle("Allenamento");
      setSelectedClientId(lockedClientId || initialClientId || "");
      setLocation("");
      setReminderMinutes(15);
      setNotes("");
      setIsAllDay(false);
      setSelectedSlot(null);
      setNotesExpanded(false);
      setSelectedDay(toISODate(today));
      setRangeStart(today);
      setRecurrence({
        enabled: false,
        frequency: "weekly",
        interval: 1,
        weekDays: [],
        monthDay: 1,
        endType: "never",
        endDate: undefined,
        occurrenceCount: 10
      });
    }
  }, [event, open, lockedClientId, initialClientId, today]);

  const rangeEnd = useMemo(() => {
    const baseEnd = addDays(rangeStart, 13);

    if (recurrence.enabled) {
      // Extend the fetched slot range to cover the last occurrence
      if (recurrence.endType === "count" && (recurrence.occurrenceCount ?? 0) > 1) {
        const seriesStart = startOfDay(new Date(`${selectedDay}T00:00:00`));
        const occurrences = generateRecurrenceOccurrences({
          startDate: seriesStart,
          config: recurrence,
          maxOccurrences: recurrence.occurrenceCount,
        });
        const last = occurrences[occurrences.length - 1] ?? seriesStart;
        const computed = addDays(startOfDay(last), 1); // include full last day
        return computed.getTime() > baseEnd.getTime() ? computed : baseEnd;
      }

      if (recurrence.endType === "until" && recurrence.endDate) {
        const untilDate = startOfDay(new Date(`${recurrence.endDate}T00:00:00`));
        const computed = addDays(untilDate, 1); // include full last day
        return computed.getTime() > baseEnd.getTime() ? computed : baseEnd;
      }
    }

    return baseEnd;
  }, [rangeStart, selectedDay, recurrence]);

  const { data: slots = [], isLoading } = useAvailableSlots({
    coachId,
    startDate: rangeStart,
    endDate: rangeEnd,
    enabled: open && !!coachId,
    isCoachView: true,
    bypassEnabledCheck: isCoachMode // Coach can see slots even if booking is disabled
  });

  const { data: clientsData } = useClientsQuery({
    q: "", 
    page: 1, 
    limit: 100 
  });
  
  const clients = clientsData?.items || [];
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  // Fetch client packages to check available sessions
  const { data: clientPackages } = useClientPackages(selectedClientId || "");
  const activePackage = clientPackages?.find(pkg => pkg.usage_status === "active");
  const availableSessions = activePackage 
    ? calculatePackageKPI(activePackage).available 
    : 0;

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
    const totalDays = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
    for (let i = 0; i < totalDays; i++) {
      const date = toISODate(addDays(rangeStart, i));
      days.push({ date, slots: grouped.get(date) || [] });
    }

    return days;
  }, [slots, rangeStart, rangeEnd]);

  const selectedDaySlots = useMemo(() => {
    return dayAvailability.find(d => d.date === selectedDay)?.slots || [];
  }, [dayAvailability, selectedDay]);

  const handlePickSlot = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
  };

  const goToPrevRange = () => {
    setRangeStart((prev) => addDays(prev, -14));
  };

  const goToNextRange = () => {
    setRangeStart((prev) => addDays(prev, 14));
  };

  const goNextAvailable = async () => {
    let searchStart = startOfDay(new Date());
    const maxSearchDays = 90;
    let daysSearched = 0;
    
    while (daysSearched < maxSearchDays) {
      const searchEnd = addDays(searchStart, 14);
      
      try {
        // Fetch slots per questo range
        const response = await getAvailableSlots({
          coachId,
          startDate: searchStart.toISOString(),
          endDate: searchEnd.toISOString(),
          isCoachView: isCoachMode,
          bypassEnabledCheck: isCoachMode,
        });
        
        if (response.length > 0) {
          // Trovato! Organizza gli slot per data
          const firstSlot = response[0];
          const firstDate = toISODate(new Date(firstSlot.start));
          
          // Imposta il range corretto per mostrare gli slot
          setRangeStart(searchStart);
          setSelectedDay(firstDate);
          setSelectedSlot(firstSlot);
          
          // Scroll alla posizione dopo un breve delay per permettere il rendering
          setTimeout(() => {
            const dayElem = scrollRef.current?.querySelector(`[role="tab"][aria-selected="true"]`);
            dayElem?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
          }, 100);
          
          return;
        }
        
        // Continua la ricerca
        searchStart = addDays(searchStart, 14);
        daysSearched += 14;
      } catch (error) {
        console.error("Errore durante la ricerca degli slot:", error);
        toast.error("Errore durante la ricerca degli slot disponibili");
        return;
      }
    }
    
    // Nessuno slot trovato nei prossimi 90 giorni
    toast.error("Nessuno slot disponibile nei prossimi 90 giorni");
  };

  const handleSubmit = async () => {
    if (!title || !selectedClientId) return;
    if (!isAllDay && !selectedSlot) return;

    try {
      const basePayload: any = {
        coach_id: coachId,
        client_id: selectedClientId,
        title,
        location: location || null,
        reminder_offset_minutes: reminderMinutes || null,
        notes: notes || null,
        is_all_day: isAllDay,
      };

      if (isEditMode && event) {
        // Update existing event
        const updatePayload: any = {
          ...basePayload,
          start_at: isAllDay ? `${selectedDay}T00:00:00Z` : selectedSlot!.start,
          end_at: isAllDay ? `${selectedDay}T23:59:59Z` : selectedSlot!.end,
        };

        await updateEvent.mutateAsync({
          id: event.id,
          data: updatePayload
        });
      } else {
        // Create new event(s)
        if (isAllDay) {
          await createEvent.mutateAsync({
            ...basePayload,
            start_at: `${selectedDay}T00:00:00Z`,
            end_at: `${selectedDay}T23:59:59Z`,
          });
        } else if (recurrence.enabled) {
          // Generate all recurrence occurrences
          const firstSlotDate = new Date(selectedSlot!.start);
          const occurrences = generateRecurrenceOccurrences({
            startDate: firstSlotDate,
            config: recurrence,
          });

          // Validate package sessions before creating recurring events
          if (availableSessions === 0) {
            toast.error(
              "Il cliente non ha un pacchetto attivo. Crea un pacchetto prima di schedulare eventi ricorrenti.",
              { duration: 5000 }
            );
            return;
          }

          if (occurrences.length > availableSessions) {
            toast.error(
              `Sessioni insufficienti. Disponibili: ${availableSessions}, richieste: ${occurrences.length}. ` +
              `Aggiungi sessioni al pacchetto o riduci il numero di eventi.`,
              { duration: 6000 }
            );
            return;
          }

          toast.info(`Generazione di ${occurrences.length} appuntamenti ricorrenti...`);

          // Get slot time (hours and minutes) from the selected slot
          const slotStartTime = {
            hours: firstSlotDate.getHours(),
            minutes: firstSlotDate.getMinutes(),
          };
          const slotEndTime = new Date(selectedSlot!.end);
          const slotEndHours = slotEndTime.getHours();
          const slotEndMinutes = slotEndTime.getMinutes();

          // Create an event for each occurrence
          let createdCount = 0;
          let skippedCount = 0;

          for (const occurrenceDate of occurrences) {
            // Set the same time as the original slot
            const eventStartDate = setMinutes(
              setHours(startOfDay(occurrenceDate), slotStartTime.hours),
              slotStartTime.minutes
            );
            const eventEndDate = setMinutes(
              setHours(startOfDay(occurrenceDate), slotEndHours),
              slotEndMinutes
            );

            // Check if there's an available slot at this time
            const hasSlot = dayAvailability.some(day => {
              if (day.date !== toISODate(occurrenceDate)) return false;
              return day.slots.some(slot => {
                const slotStart = new Date(slot.start);
                return slotStart.getHours() === slotStartTime.hours && 
                       slotStart.getMinutes() === slotStartTime.minutes;
              });
            });

            if (!hasSlot) {
              skippedCount++;
              continue; // Skip this occurrence if no slot available
            }

            try {
              await createEvent.mutateAsync({
                ...basePayload,
                start_at: eventStartDate.toISOString(),
                end_at: eventEndDate.toISOString(),
              });
              createdCount++;
            } catch (error) {
              console.error("Error creating recurring event:", error);
              skippedCount++;
            }
          }

          if (createdCount > 0) {
            // Log recurring events activity (aggregate for multiple events)
            if (createdCount > 1 && selectedClientId) {
              await logClientActivity(
                selectedClientId,
                "EVENT_RECURRING_CREATED",
                `${createdCount} appuntamenti ricorrenti programmati`
              );
            }
            
            toast.success(
              `${createdCount} appuntamento/i creato/i con successo${
                skippedCount > 0 ? ` (${skippedCount} saltato/i per mancanza di disponibilità)` : ""
              }`
            );
          } else {
            toast.error("Nessun appuntamento creato. Verifica la tua disponibilità.");
            return;
          }
        } else {
          await createEvent.mutateAsync({
            ...basePayload,
            start_at: selectedSlot!.start,
            end_at: selectedSlot!.end,
          });
        }
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast.error("Errore durante il salvataggio dell'appuntamento");
    }
  };

  const canSubmit = title && selectedClientId && (isAllDay || selectedSlot);
  const isPending = createEvent.isPending || updateEvent.isPending;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl bg-background shadow-2xl border border-border/50 flex flex-col"
      >
        {/* Header - STICKY */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 p-6 pb-4 z-10 shrink-0">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold tracking-tight">
              {isEditMode ? "Modifica appuntamento" : "Nuovo appuntamento"}
            </h2>
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
                required
                autoFocus={!isEditMode}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client" className="text-xs font-medium text-muted-foreground">Cliente *</Label>
              {lockedClientId ? (
                <div className="w-full px-3 py-2 rounded-md border border-border bg-muted text-foreground">
                  {clients.find((c) => c.id === lockedClientId)?.first_name}{" "}
                  {clients.find((c) => c.id === lockedClientId)?.last_name}
                </div>
              ) : (
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
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Durata: <span className="font-medium text-foreground">{durationMinutes} min</span> · allineato alla tua disponibilità
          </p>
        </div>

        {/* Main Content - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6">
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
                      className="pointer-events-auto"
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
                      isSubmitting={isPending}
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

          {/* Event Details */}
          <div className="space-y-4 pt-4 border-t border-border/30">
            <h3 className="text-sm font-semibold text-foreground/80">Dettagli opzionali</h3>

            {/* Location - STANDARD STYLING */}
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-sm">Luogo</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="es. Palestra, Online"
              />
            </div>

            {/* Reminder - STANDARD STYLING */}
            <div className="space-y-1.5">
              <Label htmlFor="reminder" className="text-sm">Promemoria</Label>
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
                  className="min-h-[80px] resize-none"
                  rows={3}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Recurrence Section - Only for new appointments */}
          {!isEditMode && (
            <div className="pt-4 border-t border-border/30">
              <RecurrenceSection
                config={recurrence}
                onChange={setRecurrence}
                startDate={selectedSlot ? new Date(selectedSlot.start) : new Date(selectedDay + "T09:00:00")}
                maxOccurrences={availableSessions > 0 ? availableSessions : undefined}
                onMaxOccurrencesExceeded={() => {
                  toast.warning(
                    `Puoi creare massimo ${availableSessions} eventi ricorrenti in base alle sessioni disponibili nel pacchetto.`,
                    { duration: 4000 }
                  );
                }}
              />
              
              {/* Package sessions warning */}
              {recurrence.enabled && selectedClientId && (
                <Alert 
                  variant={
                    !activePackage ? "destructive" : 
                    availableSessions === 0 ? "destructive" : 
                    (recurrence.endType === 'count' && (recurrence.occurrenceCount || 10) > availableSessions) ? "destructive" : 
                    "default"
                  }
                  className="mt-4"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {!activePackage ? (
                      <span className="text-sm">
                        ⚠️ Il cliente non ha un pacchetto attivo. Crea un pacchetto prima di schedulare eventi ricorrenti.
                      </span>
                    ) : availableSessions === 0 ? (
                      <span className="text-sm">
                        ⚠️ Nessuna sessione disponibile nel pacchetto. Aggiungi sessioni prima di schedulare.
                      </span>
                    ) : (
                      <span className="text-sm">
                        ✅ Sessioni disponibili: <strong>{availableSessions}</strong>
                        {recurrence.endType === 'count' && (recurrence.occurrenceCount || 10) > availableSessions && (
                          <span className="text-destructive font-semibold ml-1">
                            (Insufficienti per {recurrence.occurrenceCount || 10} eventi)
                          </span>
                        )}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Footer - STICKY */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/50 p-6 pt-4 shrink-0">
          <div className="flex justify-between items-center gap-3">
            {/* Pulsante Avvia Sessione - Solo in edit mode con cliente */}
            {canStartSession && (
              <Button 
                variant="default"
                onClick={() => {
                  if (event && onStartSession) {
                    onStartSession(
                      selectedClientId, 
                      event.id,
                      event.linked_plan_id,
                      event.linked_day_id
                    );
                    onOpenChange(false);
                  }
                }}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Avvia sessione
              </Button>
            )}
            
            {/* Spacer se non c'è il pulsante avvia sessione */}
            {!canStartSession && <div />}
            
            {/* Bottoni esistenti a destra */}
            <div className="flex gap-3">
              <Button 
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="px-6"
              >
                Annulla
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!canSubmit || isPending}
                className="px-6 shadow-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? "Aggiornamento..." : "Creazione..."}
                  </>
                ) : (
                  isEditMode ? "Aggiorna appuntamento" : "Crea appuntamento"
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
