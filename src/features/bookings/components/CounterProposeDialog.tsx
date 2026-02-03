import { useState, useMemo, useEffect } from "react";
import { format, startOfDay, addDays, parseISO, setHours, setMinutes, addMinutes } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, Check, Sparkles, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useBookingSettingsQuery } from "../hooks/useBookingSettingsQuery";
import { useAvailabilityWindowsQuery } from "../hooks/useAvailabilityWindowsQuery";
import { useOutOfOfficeBlocksQuery } from "../hooks/useOutOfOfficeBlocksQuery";
import { useEventsQuery } from "@/features/events/hooks/useEventsQuery";
import { generateAvailableSlots, findNearestSlots } from "../utils/slot-generator";
import type { BookingRequestWithClient, AvailableSlot } from "../types";

interface CounterProposeDialogProps {
  request: BookingRequestWithClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, startAt: string, endAt: string) => void;
  isSubmitting?: boolean;
}

export function CounterProposeDialog({
  request,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: CounterProposeDialogProps) {
  // SELECTION MODE (mutua esclusività)
  const [selectionMode, setSelectionMode] = useState<'suggested' | 'manual' | null>(null);
  
  // FAST PATH
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  
  // POWER PATH
  const [manualDate, setManualDate] = useState<Date | undefined>(undefined);
  const [manualTime, setManualTime] = useState<string>("");
  
  // LIVE VALIDATION
  const [availabilityStatus, setAvailabilityStatus] = useState<
    'idle' | 'loading' | 'available' | 'conflict'
  >('idle');
  const [conflictEvent, setConflictEvent] = useState<{
    title: string;
    start: string;
    end: string;
  } | null>(null);
  const [alternativeSlots, setAlternativeSlots] = useState<AvailableSlot[]>([]);

  // Fetch settings and availability data
  const { data: settings } = useBookingSettingsQuery();
  const { data: windows = [] } = useAvailabilityWindowsQuery();
  const { data: oooBlocks = [] } = useOutOfOfficeBlocksQuery();
  
  const rangeStart = startOfDay(new Date());
  const rangeEnd = addDays(rangeStart, settings?.max_future_days || 30);
  const { data: events = [] } = useEventsQuery({
    start_date: format(rangeStart, 'yyyy-MM-dd'),
    end_date: format(rangeEnd, 'yyyy-MM-dd'),
  });

  const slotDuration = settings?.slot_duration_minutes || 60;
  const minAdvanceNotice = settings?.min_advance_notice_hours || 2;
  const bufferBetween = settings?.buffer_between_minutes || 0;

  // Original request details
  const originalStart = request ? new Date(request.requested_start_at) : null;
  const originalEnd = request ? new Date(request.requested_end_at) : null;

  // Debounced manual inputs for live validation
  const debouncedManualDate = useDebounce(manualDate, 300);
  const debouncedManualTime = useDebounce(manualTime, 300);

  // Reset state when dialog opens/closes or request changes
  useEffect(() => {
    if (open && request) {
      setSelectionMode(null);
      setSelectedSlot(null);
      setManualDate(undefined);
      setManualTime("");
      setAvailabilityStatus('idle');
      setConflictEvent(null);
      setAlternativeSlots([]);
    }
  }, [open, request?.id]);

  // Get all available slots for the next 14 days to find suggestions
  const allSlotsFor14Days = useMemo(() => {
    if (!settings) return [];
    
    const allSlots: AvailableSlot[] = [];
    const today = startOfDay(new Date());
    
    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i);
      const daySlots = generateAvailableSlots({
        date,
        slotDurationMinutes: slotDuration,
        bufferBetweenMinutes: bufferBetween,
        minAdvanceNoticeHours: minAdvanceNotice,
        availabilityWindows: windows,
        outOfOfficeBlocks: oooBlocks.map(b => ({ start_at: b.start_at, end_at: b.end_at })),
        existingEvents: events.map(e => ({ start_at: e.start_at, end_at: e.end_at })),
      });
      allSlots.push(...daySlots);
    }
    
    return allSlots;
  }, [windows, oooBlocks, events, slotDuration, bufferBetween, minAdvanceNotice, settings]);

  // Get suggested slots (nearest to original request)
  const suggestedSlots = useMemo(() => {
    if (!originalStart || allSlotsFor14Days.length === 0) return [];
    
    // Find nearest slots, excluding the original request time
    return findNearestSlots(
      originalStart,
      allSlotsFor14Days,
      request?.requested_start_at
    ).slice(0, 4);
  }, [originalStart, allSlotsFor14Days, request?.requested_start_at]);

  // LIVE VALIDATION: Check manual selection for conflicts
  useEffect(() => {
    // Skip if not in manual mode or data incomplete
    if (selectionMode !== 'manual' || !debouncedManualDate || !debouncedManualTime) {
      setAvailabilityStatus('idle');
      setConflictEvent(null);
      setAlternativeSlots([]);
      return;
    }

    setAvailabilityStatus('loading');

    // Parse time
    const [hours, minutes] = debouncedManualTime.split(':').map(Number);
    const proposedStart = setMinutes(setHours(debouncedManualDate, hours), minutes);
    const proposedEnd = addMinutes(proposedStart, slotDuration);

    // Find conflicts (ignore canceled events)
    const conflicting = events.find(event => {
      if (event.session_status === 'canceled') return false;
      const eventStart = parseISO(event.start_at);
      const eventEnd = parseISO(event.end_at);
      return proposedStart < eventEnd && proposedEnd > eventStart;
    });

    if (conflicting) {
      setAvailabilityStatus('conflict');
      setConflictEvent({
        title: conflicting.title || 'Evento',
        start: conflicting.start_at,
        end: conflicting.end_at,
      });
      // Find 3 nearest alternatives
      setAlternativeSlots(findNearestSlots(proposedStart, allSlotsFor14Days).slice(0, 3));
    } else {
      setAvailabilityStatus('available');
      setConflictEvent(null);
      setAlternativeSlots([]);
    }
  }, [debouncedManualDate, debouncedManualTime, selectionMode, events, slotDuration, allSlotsFor14Days]);

  // HANDLERS: Mutual exclusivity between paths
  const handleSuggestedSlotClick = (slot: AvailableSlot) => {
    setSelectionMode('suggested');
    setSelectedSlot(slot);
    // Reset power path
    setManualDate(undefined);
    setManualTime("");
    setAvailabilityStatus('idle');
    setConflictEvent(null);
    setAlternativeSlots([]);
  };

  const handleManualDateChange = (date: Date | undefined) => {
    setSelectionMode('manual');
    setManualDate(date);
    // Reset fast path
    setSelectedSlot(null);
  };

  const handleManualTimeChange = (time: string) => {
    setSelectionMode('manual');
    setManualTime(time);
    // Reset fast path
    setSelectedSlot(null);
  };

  // COMPUTED: Active proposal for CTA
  const activeProposal = useMemo((): AvailableSlot | null => {
    // FAST PATH
    if (selectionMode === 'suggested' && selectedSlot) {
      return selectedSlot;
    }

    // POWER PATH (only if available)
    if (selectionMode === 'manual' && manualDate && manualTime && 
        availabilityStatus === 'available') {
      const [hours, minutes] = manualTime.split(':').map(Number);
      const start = setMinutes(setHours(manualDate, hours), minutes);
      const end = addMinutes(start, slotDuration);
      return { 
        start: start.toISOString(), 
        end: end.toISOString() 
      };
    }

    return null;
  }, [selectionMode, selectedSlot, manualDate, manualTime, availabilityStatus, slotDuration]);

  const handleSubmit = () => {
    if (!activeProposal || !request) return;
    onSubmit(request.id, activeProposal.start, activeProposal.end);
  };

  const isSlotSelected = (slot: AvailableSlot) => {
    return selectedSlot && 
      slot.start === selectedSlot.start &&
      slot.end === selectedSlot.end;
  };

  const formatSlotTime = (slot: AvailableSlot) => {
    const start = parseISO(slot.start);
    const end = parseISO(slot.end);
    return `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`;
  };

  const formatSlotDate = (slot: AvailableSlot) => {
    return format(parseISO(slot.start), "EEE d MMM", { locale: it });
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] p-0 gap-0 grid grid-rows-[auto_1fr_auto] overflow-hidden">
        {/* Header - Original Request Context */}
        <div className="bg-muted/50 border-b px-4 py-3">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-medium">
              Proponi nuovo orario
            </DialogTitle>
            {originalStart && originalEnd && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Richiesta originale:</span>
                <Badge variant="outline" className="font-normal">
                  {format(originalStart, "EEE d MMM", { locale: it })} · {format(originalStart, "HH:mm")}–{format(originalEnd, "HH:mm")}
                </Badge>
              </div>
            )}
          </DialogHeader>
        </div>

        <div className="min-h-0 overflow-y-auto">
          {/* FAST PATH: Suggested Slots Section */}
          {suggestedSlots.length > 0 && (
            <div className="px-4 py-3 border-b bg-primary/5">
              <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
                <Sparkles className="h-4 w-4" />
                Orari consigliati
              </div>
              <div className="grid grid-cols-2 gap-2">
                {suggestedSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedSlotClick(slot)}
                    className={cn(
                      "flex flex-col items-start p-2 rounded-lg border text-left transition-all",
                      "hover:border-primary hover:bg-primary/5",
                      isSlotSelected(slot)
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-border bg-background"
                    )}
                  >
                    <span className="text-xs text-muted-foreground capitalize">
                      {formatSlotDate(slot)}
                    </span>
                    <span className="text-sm font-medium flex items-center gap-1">
                      {formatSlotTime(slot)}
                      {isSlotSelected(slot) && (
                        <Check className="h-3 w-3 text-primary" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* POWER PATH: Manual Selection */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Oppure scegli manualmente
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Calendar Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !manualDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {manualDate ? format(manualDate, "d MMM", { locale: it }) : "Data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={manualDate}
                    onSelect={handleManualDateChange}
                    disabled={(date) => 
                      date < startOfDay(new Date()) || 
                      date > rangeEnd
                    }
                    locale={it}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              {/* Time Picker 15min intervals */}
              <TimePicker
                value={manualTime}
                onChange={handleManualTimeChange}
                interval={15}
                startHour={6}
                endHour={22}
                placeholder="Orario"
              />
            </div>
            
            {/* Live Validation Status */}
            {selectionMode === 'manual' && manualDate && manualTime && (
              <div className="mt-3">
                {availabilityStatus === 'loading' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifica disponibilità...
                  </div>
                )}
                
                {availabilityStatus === 'available' && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    Slot disponibile
                  </div>
                )}
                
                {availabilityStatus === 'conflict' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <X className="h-4 w-4" />
                      Conflitto: {conflictEvent?.title}
                    </div>
                    
                    {alternativeSlots.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Orari alternativi:</p>
                        <div className="flex flex-wrap gap-1">
                          {alternativeSlots.map((slot, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleSuggestedSlotClick(slot)}
                            >
                              {formatSlotDate(slot)} · {formatSlotTime(slot)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer - Dynamic CTA */}
        <div className="border-t bg-background p-4">
          {activeProposal ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-600" />
                Proposta pronta per l'invio
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                Proponi · {formatSlotDate(activeProposal)} · {formatSlotTime(activeProposal)}
              </Button>
            </div>
          ) : (
            <Button disabled className="w-full" size="lg">
              Seleziona un orario
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
