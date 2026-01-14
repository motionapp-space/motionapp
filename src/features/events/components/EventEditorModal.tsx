import { useState, useEffect, useMemo, useCallback } from "react";
import { format, addMinutes, differenceInMinutes, isWithinInterval, startOfDay, setHours, setMinutes } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar as CalendarIcon, AlertTriangle, Info, AlertCircle, Trash2, Play, Pencil, MapPin, Clock, User, UserCircle, Bell, FileText, Package, Gift, CreditCard } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getCoachClientId, getClientIdFromCoachClient } from "@/lib/coach-client";
import { useCreateEvent } from "../hooks/useCreateEvent";
import { useUpdateEvent } from "../hooks/useUpdateEvent";
import { useClientsQuery } from "@/features/clients/hooks/useClientsQuery";
import { useClientPackages } from "@/features/packages/hooks/useClientPackages";
import { useEventsQuery } from "../hooks/useEventsQuery";
import { usePackageSettings } from "@/features/packages/hooks/usePackageSettings";
import { calculatePackageKPI } from "@/features/packages/utils/kpi";
import { generateRecurrenceOccurrences } from "../utils/recurrence";
import { RecurrenceSection, type RecurrenceConfig } from "./RecurrenceSection";
import { handleEventConfirm } from "@/features/packages/api/calendar-integration.api";
import { createLedgerEntry } from "@/features/packages/api/ledger.api";
import { createPackage } from "@/features/packages/api/packages.api";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { EventWithClient, Event } from "../types";
import { Badge } from "@/components/ui/badge";
import { useBookingSettingsQuery } from "@/features/bookings/hooks/useBookingSettingsQuery";
import { deriveEventBadge } from "../utils/deriveEventBadge";

// Tipo per la scelta economica esplicita
type LessonType = "free" | "single" | "package";

interface EventEditorModalProps {
  mode: 'new' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachId: string;
  initialDate?: Date;
  initialStartTime?: Date;
  initialEndTime?: Date;
  lockedClientId?: string;
  event?: EventWithClient;
  onStartSession?: (clientId: string, eventId: string, linkedPlanId?: string, linkedDayId?: string) => void;
}

// Helper function to round time to nearest 15 minutes
function roundToNearest15Minutes(date: Date): string {
  const minutes = Math.ceil(date.getMinutes() / 15) * 15;
  const hours = date.getHours() + Math.floor(minutes / 60);
  const roundedMinutes = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
}

// Generate time slots with 15-minute intervals (Google Calendar style)
function generateTimeSlots() {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

// Format duration for display next to end time
function formatDurationLabel(startTime: string, endTime: string): string {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const mins = (endH * 60 + endM) - (startH * 60 + startM);
  
  if (mins <= 0) return "";
  if (mins < 60) return `(${mins} min)`;
  
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  
  if (remainingMins === 0) {
    return hours === 1 ? "(1 ora)" : `(${hours} ore)`;
  }
  return `(${hours}h ${remainingMins}min)`;
}

export function EventEditorModal({
  mode,
  open,
  onOpenChange,
  coachId,
  initialDate,
  initialStartTime,
  initialEndTime,
  lockedClientId,
  event,
  onStartSession
}: EventEditorModalProps) {
  const isEditMode = mode === 'edit';
  const isNewMode = mode === 'new';

  // Default date/time values
  const defaultDate = initialDate || (event?.start_at ? new Date(event.start_at) : new Date());
  const defaultStartTime = initialStartTime || (event?.start_at ? new Date(event.start_at) : new Date());
  const defaultEndTime = initialEndTime || (event?.end_at ? new Date(event.end_at) : addMinutes(new Date(), 45));

  // State to hold resolved clientId from coach_client_id
  const [resolvedClientId, setResolvedClientId] = useState<string>('');
  
  // Resolve client_id from event's coach_client_id on mount
  useEffect(() => {
    if (event?.coach_client_id && !lockedClientId) {
      getClientIdFromCoachClient(event.coach_client_id)
        .then(clientId => setResolvedClientId(clientId))
        .catch(() => setResolvedClientId(''));
    } else if (lockedClientId) {
      setResolvedClientId(lockedClientId);
    }
  }, [event?.coach_client_id, lockedClientId]);

  // Form state
  const [formData, setFormData] = useState({
    title: event?.title || 'Allenamento',
    clientId: lockedClientId || '',
    location: event?.location || '',
    date: defaultDate,
    startTime: format(defaultStartTime, 'HH:mm'),
    endTime: format(defaultEndTime, 'HH:mm'),
    reminderOffset: event?.reminder_offset_minutes ?? 15,
    notes: event?.notes || ''
  });

  // Update formData.clientId when resolvedClientId changes
  useEffect(() => {
    if (resolvedClientId && !formData.clientId) {
      setFormData(prev => ({ ...prev, clientId: resolvedClientId }));
    }
  }, [resolvedClientId]);

  const [recurrence, setRecurrence] = useState<RecurrenceConfig>({
    enabled: false,
    frequency: "weekly",
    interval: 1,
    weekDays: [],
    monthDay: 1,
    endType: "count",
    endDate: undefined,
    occurrenceCount: 4
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'new' | 'view' | 'edit'>(isNewMode ? 'new' : 'view');
  
  // Nuovo stato per tipo di lezione economico (scelta esplicita, proattiva)
  const [lessonType, setLessonType] = useState<LessonType | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [singleLessonPrice, setSingleLessonPrice] = useState<number | null>(null);
  
  // Session conflict state
  const [showSessionConflictDialog, setShowSessionConflictDialog] = useState(false);

  // Hooks
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeSession } = useSessionStore();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const [isCancelling, setIsCancelling] = useState(false);
  const { data: clientsData } = useClientsQuery({ q: "", page: 1, limit: 100 });
  const clients = clientsData?.items || [];
  const { data: clientPackages } = useClientPackages(formData.clientId);
  const { data: packageSettings } = usePackageSettings();
  const { data: existingEvents } = useEventsQuery({ 
    start_date: format(formData.date, 'yyyy-MM-dd'),
    end_date: format(addMinutes(formData.date, 1440), 'yyyy-MM-dd')
  });
  const { data: bookingSettings } = useBookingSettingsQuery();

  // Reset form when opening in new mode or event changes
  useEffect(() => {
    if (open) {
      // Reset viewMode based on mode prop
      setViewMode(isNewMode ? 'new' : 'view');
      
      if (isNewMode) {
        const now = new Date();
        const defaultDate = initialDate || now;
        
        // Calculate start and end times based on current time or initialStartTime
        let defaultStart: string;
        let defaultEnd: string;
        
        if (initialStartTime && initialEndTime) {
          defaultStart = format(initialStartTime, 'HH:mm');
          defaultEnd = format(initialEndTime, 'HH:mm');
        } else {
          // Round current time to nearest 15 minutes
          defaultStart = roundToNearest15Minutes(now);
          
          // Calculate end time by adding duration from settings
          const [h, m] = defaultStart.split(':').map(Number);
          const startDate = setMinutes(setHours(now, h), m);
          const defaultDuration = bookingSettings?.slot_duration_minutes || 45;
          const endDate = addMinutes(startDate, defaultDuration);
          defaultEnd = format(endDate, 'HH:mm');
        }
        
        setFormData({
          title: 'Allenamento',
          clientId: lockedClientId || '',
          location: '',
          date: defaultDate,
          startTime: defaultStart,
          endTime: defaultEnd,
          reminderOffset: 15,
          notes: ''
        });
        setRecurrence({
          enabled: false,
          frequency: "weekly",
          interval: 1,
          weekDays: [],
          monthDay: 1,
          endType: "count",
          endDate: undefined,
          occurrenceCount: 4
        });
      } else if (event) {
        // Resolve client_id from coach_client_id
        getClientIdFromCoachClient(event.coach_client_id)
          .then(clientId => {
            setFormData({
              title: event.title || 'Allenamento',
              clientId: clientId,
              location: event.location || '',
              date: new Date(event.start_at),
              startTime: format(new Date(event.start_at), 'HH:mm'),
              endTime: format(new Date(event.end_at), 'HH:mm'),
              reminderOffset: event.reminder_offset_minutes ?? 15,
              notes: event.notes || ''
            });
          })
          .catch(() => {
            setFormData({
              title: event.title || 'Allenamento',
              clientId: '',
              location: event.location || '',
              date: new Date(event.start_at),
              startTime: format(new Date(event.start_at), 'HH:mm'),
              endTime: format(new Date(event.end_at), 'HH:mm'),
              reminderOffset: event.reminder_offset_minutes ?? 15,
              notes: event.notes || ''
            });
          });
      }
    }
  }, [open, mode, event, initialDate, initialStartTime, initialEndTime, lockedClientId, isNewMode, bookingSettings]);

  // Computed values
  const duration = useMemo(() => {
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    const start = setMinutes(setHours(formData.date, startH), startM);
    const end = setMinutes(setHours(formData.date, endH), endM);
    const mins = differenceInMinutes(end, start);
    
    if (mins <= 0) return "Orario non valido";
    if (mins < 60) return `${mins} minuti`;
    
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    
    if (remainingMins === 0) return `${hours} ${hours === 1 ? 'ora' : 'ore'}`;
    return `${hours} ${hours === 1 ? 'ora' : 'ore'} e ${remainingMins} minuti`;
  }, [formData.startTime, formData.endTime, formData.date]);

  const eventStartDateTime = useMemo(() => {
    const [h, m] = formData.startTime.split(':').map(Number);
    return setMinutes(setHours(startOfDay(formData.date), h), m);
  }, [formData.date, formData.startTime]);

  const eventEndDateTime = useMemo(() => {
    const [h, m] = formData.endTime.split(':').map(Number);
    return setMinutes(setHours(startOfDay(formData.date), h), m);
  }, [formData.date, formData.endTime]);

  // Check for overlapping events (warning only, not blocking)
  const overlappingEvents = useMemo(() => {
    if (!existingEvents || isEditMode) return [];
    
    return existingEvents.filter(e => {
      if (e.id === event?.id) return false;
      const eStart = new Date(e.start_at);
      const eEnd = new Date(e.end_at);
      
      return (
        isWithinInterval(eventStartDateTime, { start: eStart, end: eEnd }) ||
        isWithinInterval(eventEndDateTime, { start: eStart, end: eEnd }) ||
        isWithinInterval(eStart, { start: eventStartDateTime, end: eventEndDateTime })
      );
    });
  }, [existingEvents, eventStartDateTime, eventEndDateTime, isEditMode, event?.id]);

  // Package credits check
  const activePackage = useMemo(() => 
    clientPackages?.find(pkg => pkg.usage_status === "active"),
    [clientPackages]
  );
  
  const availableCredits = useMemo(() => 
    activePackage ? calculatePackageKPI(activePackage).available : 0,
    [activePackage]
  );

  // Filter end time slots to only show times >= start time
  const endTimeSlots = useMemo(() => {
    return TIME_SLOTS.filter(time => time >= formData.startTime);
  }, [formData.startTime]);

  // Available packages with credits for selection
  const availablePackages = useMemo(() => {
    if (!clientPackages) return [];
    return clientPackages.filter(pkg => {
      if (pkg.usage_status !== 'active') return false;
      const kpi = calculatePackageKPI(pkg);
      return kpi.available > 0;
    });
  }, [clientPackages]);

  // Credits from selected package
  const selectedPackageCredits = useMemo(() => {
    if (!selectedPackageId) return 0;
    const pkg = availablePackages.find(p => p.package_id === selectedPackageId);
    return pkg ? calculatePackageKPI(pkg).available : 0;
  }, [selectedPackageId, availablePackages]);

  // Calculate occurrences for recurrence
  const occurrences = useMemo(() => {
    if (!recurrence.enabled) return [];
    return generateRecurrenceOccurrences({
      startDate: eventStartDateTime,
      config: recurrence,
    });
  }, [recurrence, eventStartDateTime]);

  // Ultima data della serie (per validazione scadenza pacchetto)
  const lastOccurrenceDate = useMemo(() => {
    if (!recurrence.enabled || occurrences.length === 0) return null;
    return occurrences[occurrences.length - 1];
  }, [recurrence.enabled, occurrences]);

  // Check se il pacchetto selezionato scade prima dell'ultima occorrenza
  const selectedPackageExpiresBeforeSeries = useMemo(() => {
    if (!selectedPackageId || !recurrence.enabled || !lastOccurrenceDate) return false;
    const pkg = availablePackages.find(p => p.package_id === selectedPackageId);
    if (!pkg?.expires_at) return false;
    return new Date(pkg.expires_at) < lastOccurrenceDate;
  }, [selectedPackageId, recurrence.enabled, lastOccurrenceDate, availablePackages]);

  // Reset lesson type selection when client changes
  useEffect(() => {
    setLessonType(null);
    setSelectedPackageId(null);
    setSingleLessonPrice(null);
  }, [formData.clientId]);

  // Reset package selection when recurrence changes (coverage or expiration may change)
  useEffect(() => {
    if (lessonType === "package" && selectedPackageId) {
      // Check if coverage is still valid
      const creditsInsufficient = recurrence.enabled && occurrences.length > selectedPackageCredits;
      
      // Check if package expires before end of series
      const expiresBeforeSeries = selectedPackageExpiresBeforeSeries;
      
      if (creditsInsufficient || expiresBeforeSeries) {
        setSelectedPackageId(null);
      }
    }
  }, [recurrence.enabled, occurrences.length, selectedPackageCredits, lessonType, selectedPackageId, selectedPackageExpiresBeforeSeries]);

  // Default single lesson price from settings
  const defaultSinglePrice = useMemo(() => {
    return packageSettings?.sessions_1_price ?? 5000; // 50€ default
  }, [packageSettings]);

  // Validation - ora include la scelta del tipo di lezione e scadenza pacchetto
  const isValid = useMemo(() => {
    if (!formData.title.trim()) return false;
    if (!formData.clientId) return false;
    
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    
    if (endMins <= startMins) return false;
    
    // In modalità new, il tipo di lezione deve essere scelto esplicitamente
    if (isNewMode && lessonType === null) return false;
    
    // Se pacchetto selezionato con ricorrenza, deve coprire tutte le occorrenze
    if (isNewMode && lessonType === "package" && recurrence.enabled && occurrences.length > 0) {
      if (!selectedPackageId) return false;
      if (selectedPackageCredits < occurrences.length) return false;
      // Check scadenza pacchetto
      if (selectedPackageExpiresBeforeSeries) return false;
    }
    
    // Se pacchetto selezionato senza ricorrenza, deve essere valido
    if (isNewMode && lessonType === "package" && !recurrence.enabled) {
      if (!selectedPackageId) return false;
    }
    
    return true;
  }, [formData, recurrence, occurrences, lessonType, selectedPackageId, selectedPackageCredits, isNewMode, selectedPackageExpiresBeforeSeries]);

  // Validation message for tooltip
  const validationMessage = useMemo(() => {
    if (!formData.title.trim()) return "Inserisci un titolo";
    if (!formData.clientId) return "Seleziona un cliente";
    
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    
    if (endMins <= startMins) return "L'ora di fine deve essere successiva all'ora di inizio";
    
    if (isNewMode && lessonType === null) return "Seleziona il tipo di lezione";
    
    if (isNewMode && lessonType === "package") {
      if (!selectedPackageId) return "Seleziona un pacchetto";
      if (recurrence.enabled && selectedPackageCredits < occurrences.length) {
        return `Il pacchetto non copre tutte le ${occurrences.length} occorrenze`;
      }
      // Check scadenza pacchetto
      if (selectedPackageExpiresBeforeSeries && lastOccurrenceDate) {
        const selectedPkg = availablePackages.find(p => p.package_id === selectedPackageId);
        if (selectedPkg?.expires_at) {
          return `Il pacchetto scade il ${format(new Date(selectedPkg.expires_at), "d MMM yyyy", { locale: it })} ma l'ultima occorrenza è il ${format(lastOccurrenceDate, "d MMM yyyy", { locale: it })}`;
        }
      }
    }
    
    return null;
  }, [formData, recurrence, occurrences, lessonType, selectedPackageId, selectedPackageCredits, isNewMode, selectedPackageExpiresBeforeSeries, lastOccurrenceDate, availablePackages]);

  // Handlers
  const handleCreate = async () => {
    if (!isValid) return;

    try {
      // Get coach_client_id from client_id
      const coachClientId = await getCoachClientId(formData.clientId);
      
      const basePayload = {
        coach_client_id: coachClientId,
        title: formData.title,
        location: formData.location || null,
        reminder_offset_minutes: formData.reminderOffset || null,
        notes: formData.notes || null,
      };

      const [startH, startM] = formData.startTime.split(':').map(Number);
      const [endH, endM] = formData.endTime.split(':').map(Number);

      // === RICORRENZE ===
      if (recurrence.enabled && occurrences.length > 0) {
        toast.info(`Creazione di ${occurrences.length} appuntamenti ricorrenti...`);

        // Creazione batch con Promise.all per performance
        const createPromises = occurrences.map(async (occurrenceDate) => {
          const startAt = setMinutes(setHours(startOfDay(occurrenceDate), startH), startM);
          const endAt = setMinutes(setHours(startOfDay(occurrenceDate), endH), endM);

          return createEvent.mutateAsync({
            ...basePayload,
            start_at: startAt.toISOString(),
            end_at: endAt.toISOString(),
          });
        });

        const createdEvents = await Promise.all(createPromises);

        // Gestione economica in base al tipo di lezione
        if (lessonType === "free") {
          // Lezione gratuita - nessun pagamento
          toast.success(`Creati ${createdEvents.length} appuntamenti gratuiti`);
          onOpenChange(false);
          return;
        }

        if (lessonType === "single") {
          // Lezione singola - crea order_payment per ogni occorrenza
          const priceToUse = singleLessonPrice ?? defaultSinglePrice;
          
          for (const evt of createdEvents) {
            try {
              // Crea pacchetto tecnico per ogni evento
              const pkg = await createPackage({
                coach_client_id: coachClientId,
                name: `Lezione singola - ${format(new Date(evt.start_at), "d MMM yyyy", { locale: it })}`,
                total_sessions: 1,
                price_total_cents: priceToUse,
                duration_months: 1,
                payment_status: 'unpaid',
                is_single_technical: true,
              });

              // Crea HOLD per l'evento
              await createLedgerEntry(
                pkg.package_id,
                'HOLD_CREATE',
                'CONFIRM',
                0,
                1,
                evt.id,
                `Lezione singola: ${evt.title}`
              );

              // Aggiorna on_hold
              await supabase
                .from("package")
                .update({ on_hold_sessions: 1 })
                .eq("package_id", pkg.package_id);
            } catch (err) {
              console.warn('Could not create single lesson for recurring event:', err);
            }
          }

          queryClient.invalidateQueries({ queryKey: ["packages"] });
          toast.success(`Creati ${createdEvents.length} appuntamenti`, {
            description: recurrence.enabled 
              ? "Il pagamento sarà dovuto per ciascuna occorrenza" 
              : "Il pagamento sarà dovuto dopo l'appuntamento"
          });
          onOpenChange(false);
          return;
        }

        if (lessonType === "package" && selectedPackageId) {
          // Pacchetto - associa crediti agli eventi
          const pkg = availablePackages.find(p => p.package_id === selectedPackageId);
          if (!pkg) {
            toast.success(`Creati ${createdEvents.length} appuntamenti ricorrenti`);
            onOpenChange(false);
            return;
          }

          let currentOnHold = pkg.on_hold_sessions;
          const sortedEvents = [...createdEvents].sort(
            (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
          );

          for (const evt of sortedEvents) {
            try {
              await createLedgerEntry(
                pkg.package_id,
                'HOLD_CREATE',
                'CONFIRM',
                0,
                1,
                evt.id,
                `Ricorrenza: ${evt.title || 'Allenamento'}`
              );

              currentOnHold += 1;
              await supabase
                .from("package")
                .update({ on_hold_sessions: currentOnHold })
                .eq("package_id", pkg.package_id);
            } catch (err) {
              console.warn('Could not create HOLD for recurring event:', err);
            }
          }

          queryClient.invalidateQueries({ queryKey: ["packages"] });
          toast.success(`Creati ${createdEvents.length} appuntamenti ricorrenti`, {
            description: `Tutti coperti dal pacchetto`
          });
          onOpenChange(false);
          return;
        }

        // Fallback (non dovrebbe mai succedere con validazione corretta)
        toast.success(`Creati ${createdEvents.length} appuntamenti ricorrenti`);
        onOpenChange(false);
        return;
      }
      
      // === EVENTO SINGOLO ===
      const event = await createEvent.mutateAsync({
        ...basePayload,
        start_at: eventStartDateTime.toISOString(),
        end_at: eventEndDateTime.toISOString(),
      });

      // Gestione economica in base al tipo di lezione
      if (lessonType === "free") {
        toast.success("Appuntamento gratuito creato");
        onOpenChange(false);
        return;
      }

      if (lessonType === "single") {
        // Lezione singola - crea pacchetto tecnico e order_payment
        const priceToUse = singleLessonPrice ?? defaultSinglePrice;
        
        try {
          const pkg = await createPackage({
            coach_client_id: coachClientId,
            name: `Lezione singola - ${format(eventStartDateTime, "d MMM yyyy", { locale: it })}`,
            total_sessions: 1,
            price_total_cents: priceToUse,
            duration_months: 1,
            payment_status: 'unpaid',
            is_single_technical: true,
          });

          await createLedgerEntry(
            pkg.package_id,
            'HOLD_CREATE',
            'CONFIRM',
            0,
            1,
            event.id,
            `Lezione singola: ${event.title}`
          );

          await supabase
            .from("package")
            .update({ on_hold_sessions: 1 })
            .eq("package_id", pkg.package_id);

          queryClient.invalidateQueries({ queryKey: ["packages"] });
          toast.success("Appuntamento creato", {
            description: "Il pagamento sarà dovuto dopo l'appuntamento"
          });
        } catch (err) {
          console.warn('Could not create single lesson:', err);
          toast.success("Appuntamento creato");
        }
        
        onOpenChange(false);
        return;
      }

      if (lessonType === "package" && selectedPackageId) {
        // Associa al pacchetto
        try {
          await handleEventConfirm(event.id, formData.clientId, event.start_at);
          queryClient.invalidateQueries({ queryKey: ["packages"] });
          toast.success("Appuntamento creato", {
            description: "1 credito prenotato dal pacchetto"
          });
        } catch (error: any) {
          toast.warning("Appuntamento creato senza gestione crediti", {
            description: error.message
          });
        }
        
        onOpenChange(false);
        return;
      }

      // Fallback
      toast.success("Appuntamento creato");
      onOpenChange(false);
    } catch (error) {
      console.error('Create event error:', error);
    }
  };

  const handleUpdate = async () => {
    if (!isValid || !event) return;

    try {
      await updateEvent.mutateAsync({
        id: event.id,
        data: {
          title: formData.title,
          client_id: formData.clientId,
          start_at: eventStartDateTime.toISOString(),
          end_at: eventEndDateTime.toISOString(),
          location: formData.location || null,
          reminder_offset_minutes: formData.reminderOffset || null,
          notes: formData.notes || null,
        }
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Update event error:', error);
    }
  };

  const handleCancel = async () => {
    if (!event) return;
    setIsCancelling(true);

    try {
      const { data, error } = await supabase.rpc('cancel_event_with_ledger', {
        p_event_id: event.id,
        p_actor: 'coach'
      });
      
      if (error) throw error;
      
      const result = data as Record<string, unknown> | null;
      if (result?.error) throw new Error(String(result.error));
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["events"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["packages"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["package-ledger"], exact: false });
      
      // Toast dinamico basato su risposta reale
      const alreadyCanceled = result?.already_canceled as boolean | undefined;
      const economicType = result?.economic_type as string | undefined;
      const orderStatus = result?.order_status as string | undefined;
      
      if (alreadyCanceled) {
        toast.info("Evento già annullato");
      } else if (economicType === 'package') {
        toast.success("Evento cancellato", {
          description: "Sessione restituita al pacchetto"
        });
      } else if (economicType === 'single_paid') {
        toast.success("Evento cancellato", {
          description: orderStatus === 'canceled' 
            ? "Richiesta pagamento annullata" 
            : orderStatus === 'due'
              ? "Pagamento in attesa"
              : "Evento annullato"
        });
      } else {
        toast.success("Evento cancellato");
      }
      
      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Cancel event error:', error);
      toast.error("Errore", { 
        description: error.message || "Impossibile cancellare l'evento" 
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleStartSession = async () => {
    // Check if there's already an active session
    if (activeSession) {
      setShowSessionConflictDialog(true);
      return;
    }
    
    if (event && onStartSession && formData.clientId) {
      onStartSession(
        formData.clientId,
        event.id,
        event.linked_plan_id || undefined,
        event.linked_day_id || undefined
      );
    }
  };

  const handleSessionConflictResolve = (action: "return" | "proceed") => {
    setShowSessionConflictDialog(false);
    if (action === "return" && activeSession) {
      onOpenChange(false);
      navigate(`/session/live?sessionId=${activeSession.id}`);
    }
    // "proceed" does nothing - user must first complete the active session
  };

  const canStartSession = isEditMode && !!event && !!onStartSession;

  // Determina lo stato dell'appuntamento per il badge usando helper centralizzato
  const getEventStatusBadge = () => {
    if (!event) return null;
    
    const badgeType = deriveEventBadge(event);
    
    switch (badgeType) {
      case "CANCELED":
        return (
          <Badge className="bg-red-50 text-red-700 border-0 text-xs font-normal">
            Annullato
          </Badge>
        );
      case "PROPOSAL_PENDING":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-0 text-xs font-normal">
            In proposta
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-muted/80 text-muted-foreground/80 border-0 text-xs font-normal">
            Completato
          </Badge>
        );
      case "CONFIRMED":
      default:
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-0 text-xs font-normal">
            Confermato
          </Badge>
        );
    }
  };

  // Formatta il campo "Creato da"
  const getCreatedByText = () => {
    if (!event) return '';
    return event.source === 'client' ? 'Cliente' : 'Professionista';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[680px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          {/* Header - compact, Linear/Google style */}
          <DialogHeader className="h-14 px-6 flex-shrink-0 flex flex-row items-center justify-between border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <DialogTitle className="text-lg font-semibold text-foreground leading-none">
                {viewMode === 'view' ? formData.title : (viewMode === 'edit' ? 'Modifica appuntamento' : 'Nuovo appuntamento')}
              </DialogTitle>
              {viewMode === 'view' && (
                <>
                  {getEventStatusBadge()}
                  {event?.recurrence_rule && (
                    <Badge variant="outline" className="text-xs font-normal">
                      Ricorrente
                    </Badge>
                  )}
                </>
              )}
            </div>
            <DialogDescription className="sr-only">
              {viewMode === 'view' 
                ? `Dettagli appuntamento: ${formData.title}` 
                : viewMode === 'edit' 
                  ? 'Modifica i dettagli dell\'appuntamento' 
                  : 'Crea un nuovo appuntamento con un cliente'}
            </DialogDescription>
          </DialogHeader>

          {/* Content - consistent 24px padding */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-6">
            
            {/* READ-ONLY VIEW */}
            {viewMode === 'view' && event && (
              <div className="space-y-6">
                {/* Data & Orario */}
                <div className="flex items-start gap-4">
                  <div className="h-9 w-9 rounded-full bg-muted/40 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-[18px] w-[18px] text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[11px] font-normal text-muted-foreground/70 uppercase tracking-wider mb-1.5">
                      Data e ora
                    </p>
                    <p className="text-base font-medium text-foreground">
                      {format(formData.date, "EEEE d MMMM", { locale: it })} • {formData.startTime} – {formData.endTime}
                      <span className="text-muted-foreground font-normal ml-1.5">({duration})</span>
                    </p>
                  </div>
                </div>

                {/* Cliente */}
                <div className="flex items-start gap-4">
                  <div className="h-9 w-9 rounded-full bg-muted/40 flex items-center justify-center flex-shrink-0">
                    <User className="h-[18px] w-[18px] text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[11px] font-normal text-muted-foreground/70 uppercase tracking-wider mb-1.5">
                      Cliente
                    </p>
                    <button
                      onClick={() => {
                        onOpenChange(false);
                        window.location.href = `/clients/${formData.clientId}`;
                      }}
                      className="text-base font-medium text-primary hover:underline text-left focus:outline-none focus-visible:ring-0"
                    >
                      {clients.find(c => c.id === formData.clientId)?.first_name} {clients.find(c => c.id === formData.clientId)?.last_name}
                    </button>
                  </div>
                </div>

                {/* Creato da */}
                <div className="flex items-start gap-4">
                  <div className="h-9 w-9 rounded-full bg-muted/40 flex items-center justify-center flex-shrink-0">
                    <UserCircle className="h-[18px] w-[18px] text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[11px] font-normal text-muted-foreground/70 uppercase tracking-wider mb-1.5">
                      Creato da
                    </p>
                    <p className="text-base font-medium text-foreground">{getCreatedByText()}</p>
                  </div>
                </div>

                {/* Luogo (se presente) */}
                {formData.location && (
                  <div className="flex items-start gap-4">
                    <div className="h-9 w-9 rounded-full bg-muted/40 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-[18px] w-[18px] text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[11px] font-normal text-muted-foreground/70 uppercase tracking-wider mb-1.5">
                        Luogo
                      </p>
                      <p className="text-base font-medium text-foreground">{formData.location}</p>
                    </div>
                  </div>
                )}

                {/* Promemoria (se presente) */}
                {formData.reminderOffset && formData.reminderOffset > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="h-9 w-9 rounded-full bg-muted/40 flex items-center justify-center flex-shrink-0">
                      <Bell className="h-[18px] w-[18px] text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[11px] font-normal text-muted-foreground/70 uppercase tracking-wider mb-1.5">
                        Promemoria
                      </p>
                      <p className="text-base font-medium text-foreground">
                        {formData.reminderOffset === 15 && "15 minuti prima"}
                        {formData.reminderOffset === 60 && "1 ora prima"}
                        {formData.reminderOffset === 1440 && "1 giorno prima"}
                        {![15, 60, 1440].includes(formData.reminderOffset) && `${formData.reminderOffset} minuti prima`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Pacchetto associato (se presente) */}
                {activePackage && !activePackage.is_single_technical && (
                  <div className="flex items-start gap-4">
                    <div className="h-9 w-9 rounded-full bg-muted/40 flex items-center justify-center flex-shrink-0">
                      <Package className="h-[18px] w-[18px] text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[11px] font-normal text-muted-foreground/70 uppercase tracking-wider mb-1.5">
                        Pacchetto
                      </p>
                      <p className="text-base font-medium text-foreground">
                        {calculatePackageKPI(activePackage).available}/{activePackage.total_sessions} sessioni rimanenti
                      </p>
                    </div>
                  </div>
                )}

                {/* Note interne (se presenti) */}
                {formData.notes && (
                  <div className="flex items-start gap-4">
                    <div className="h-9 w-9 rounded-full bg-muted/40 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-[18px] w-[18px] text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[11px] font-normal text-muted-foreground/70 uppercase tracking-wider mb-2">
                        Note interne
                      </p>
                      <div className="rounded-lg bg-muted/30 border border-border/30 p-3.5">
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{formData.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* EDIT/NEW FORM */}
            {(viewMode === 'new' || viewMode === 'edit') && (
              <div className="space-y-6">
            {/* Titolo */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-medium text-foreground">
                Titolo <span className="text-muted-foreground/60">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Aggiungi un titolo"
                className="h-10"
              />
            </div>

            {/* Cliente */}
            <div className="space-y-1.5">
              <Label htmlFor="client" className="text-sm font-medium text-foreground">
                Cliente <span className="text-muted-foreground/60">*</span>
              </Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
                disabled={!!lockedClientId}
              >
                <SelectTrigger id="client" className="h-10">
                  <SelectValue placeholder="Seleziona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data / Orari - horizontal aligned grid */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-3 gap-3">
                {/* Data */}
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-sm font-medium text-foreground">Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          !formData.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formData.date ? format(formData.date, "d MMM yyyy", { locale: it }) : "Seleziona"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(newDate) => newDate && setFormData(prev => ({ ...prev, date: newDate }))}
                        initialFocus
                        locale={it}
                        className="pointer-events-auto"
                        disabled={(date) => viewMode === 'new' && date < startOfDay(new Date())}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Dalle */}
                <div className="space-y-1.5">
                  <Label htmlFor="start-time" className="text-sm font-medium text-foreground">Dalle</Label>
                  <Select
                    value={formData.startTime}
                    onValueChange={(value) => {
                      const [oldStartH, oldStartM] = formData.startTime.split(':').map(Number);
                      const [oldEndH, oldEndM] = formData.endTime.split(':').map(Number);
                      const currentDuration = (oldEndH * 60 + oldEndM) - (oldStartH * 60 + oldStartM);
                      const durationVal = currentDuration > 0 ? currentDuration : (bookingSettings?.slot_duration_minutes || 45);
                      
                      const [h, m] = value.split(':').map(Number);
                      const startDate = setMinutes(setHours(new Date(), h), m);
                      const endDate = addMinutes(startDate, durationVal);
                      
                      const endMinutes = Math.ceil((endDate.getHours() * 60 + endDate.getMinutes()) / 15) * 15;
                      const endH = Math.floor(endMinutes / 60) % 24;
                      const endM = endMinutes % 60;
                      const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
                      const finalEndTime = endTime >= value ? endTime : value;
                      
                      setFormData(prev => ({ 
                        ...prev, 
                        startTime: value,
                        endTime: finalEndTime
                      }));
                    }}
                  >
                    <SelectTrigger id="start-time" className="h-10">
                      <SelectValue placeholder="Inizio" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Alle */}
                <div className="space-y-1.5">
                  <Label htmlFor="end-time" className="text-sm font-medium text-foreground">Alle</Label>
                  <Select value={formData.endTime} onValueChange={(value) => setFormData(prev => ({ ...prev, endTime: value }))}>
                    <SelectTrigger id="end-time" className="h-10">
                      <SelectValue placeholder="Fine" />
                    </SelectTrigger>
                    <SelectContent>
                      {endTimeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          <span className="flex items-center gap-2">
                            {time}
                            <span className="text-muted-foreground text-xs">
                              {formatDurationLabel(formData.startTime, time)}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Durata calcolata - meta info */}
              <p className="text-[12px] text-muted-foreground/80 mt-1">
                Durata: {duration}
              </p>
            </div>

            {/* Ricorrenza (solo in modalità new) */}
            {isNewMode && (
              <RecurrenceSection
                config={recurrence}
                onChange={setRecurrence}
                startDate={formData.date}
              />
            )}

            {/* SEZIONE: Tipo di lezione - decisione economica strutturale */}
            {isNewMode && (
              <div className="pt-4 space-y-3">
                <div className="space-y-0.5">
                  <h3 className="text-[15px] font-semibold text-foreground">
                    Tipo di lezione <span className="text-muted-foreground/60">*</span>
                  </h3>
                  <p className="text-[13px] text-muted-foreground">
                    Definisce come verrà gestito il pagamento
                  </p>
                </div>
                
                {!formData.clientId ? (
                  <p className="text-[13px] text-muted-foreground/70 italic">
                    Seleziona un cliente per vedere le opzioni
                  </p>
                ) : (
                  <RadioGroup
                    value={lessonType || ""}
                    onValueChange={(value) => {
                      setLessonType(value as LessonType);
                      if (value !== "package") setSelectedPackageId(null);
                      if (value !== "single") setSingleLessonPrice(null);
                    }}
                    className="space-y-4"
                  >
                    {/* Lezione gratuita */}
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value="free" id="lesson-free" className="mt-0.5" />
                      <div className="space-y-1">
                        <Label htmlFor="lesson-free" className="font-normal cursor-pointer flex items-center gap-2">
                          <Gift className="h-4 w-4 text-muted-foreground" />
                          Lezione gratuita
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {lessonType === "free" 
                            ? (recurrence.enabled 
                                ? "Nessuna occorrenza di questa serie genererà pagamenti o consumi."
                                : "Questo appuntamento non genera alcun pagamento.")
                            : "Nessun pagamento richiesto"}
                        </p>
                      </div>
                    </div>
                    
                    {/* Lezione singola */}
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value="single" id="lesson-single" className="mt-0.5" />
                      <div className="space-y-2 flex-1">
                        <Label htmlFor="lesson-single" className="font-normal cursor-pointer flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          Lezione singola
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Pagamento singolo per questa lezione
                        </p>
                        {lessonType === "single" && (
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={(singleLessonPrice ?? defaultSinglePrice) / 100}
                                onChange={(e) => setSingleLessonPrice(Math.round(parseFloat(e.target.value) * 100) || defaultSinglePrice)}
                                className="w-24"
                                min="0"
                                step="0.01"
                              />
                              <span className="text-sm text-muted-foreground">€</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {recurrence.enabled 
                                ? "Il pagamento sarà dovuto per ciascuna occorrenza."
                                : "Il pagamento sarà dovuto dopo l'appuntamento o in caso di cancellazione tardiva."}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pacchetto */}
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem 
                        value="package" 
                        id="lesson-package" 
                        className="mt-0.5"
                        disabled={availablePackages.length === 0}
                      />
                      <div className="space-y-2 flex-1">
                        <Label 
                          htmlFor="lesson-package" 
                          className={cn(
                            "font-normal cursor-pointer flex items-center gap-2",
                            availablePackages.length === 0 && "text-muted-foreground/50 cursor-not-allowed"
                          )}
                        >
                          <Package className={cn(
                            "h-4 w-4",
                            availablePackages.length === 0 ? "text-muted-foreground/50" : "text-muted-foreground"
                          )} />
                          Pacchetto
                          {availablePackages.length === 0 && (
                            <span className="text-xs">(nessun pacchetto attivo)</span>
                          )}
                        </Label>
                        <p className={cn(
                          "text-xs",
                          availablePackages.length === 0 ? "text-muted-foreground/50" : "text-muted-foreground"
                        )}>
                          {availablePackages.length > 0 
                            ? "Scala le lezioni da un pacchetto esistente"
                            : "Nessun pacchetto attivo per questo cliente"}
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                )}

                {/* Lista pacchetti esplosa (fuori dal RadioGroup per struttura pulita) */}
                {formData.clientId && lessonType === "package" && availablePackages.length > 0 && (
                  <div className="space-y-3 pl-7">
                    {/* Contesto occorrenze per serie ricorrenti */}
                    {recurrence.enabled && occurrences.length > 0 && (
                      <p className="text-sm font-medium">
                        Questa serie crea {occurrences.length} appuntamenti
                      </p>
                    )}
                    
                    {/* Lista pacchetti */}
                    <div className="space-y-2">
                      {availablePackages.map((pkg) => {
                        const kpi = calculatePackageKPI(pkg);
                        const hasSufficientCredits = !recurrence.enabled || kpi.available >= occurrences.length;
                        const expiresBeforeSeries = recurrence.enabled && lastOccurrenceDate && 
                          pkg.expires_at && new Date(pkg.expires_at) < lastOccurrenceDate;
                        const canCover = hasSufficientCredits && !expiresBeforeSeries;
                        const isSelected = selectedPackageId === pkg.package_id;
                        
                        return (
                          <div 
                            key={pkg.package_id}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                              canCover && "hover:bg-muted/50 cursor-pointer",
                              !canCover && "opacity-60 cursor-not-allowed bg-muted/20",
                              isSelected && canCover && "border-primary bg-primary/5"
                            )}
                            onClick={() => canCover && setSelectedPackageId(pkg.package_id)}
                          >
                            <div className={cn(
                              "w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0",
                              isSelected && canCover ? "border-primary" : "border-muted-foreground/40",
                              !canCover && "border-muted-foreground/20"
                            )}>
                              {isSelected && canCover && (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0 space-y-1">
                              {/* Riga 1: Nome pacchetto */}
                              <p className={cn(
                                "font-medium text-sm",
                                !canCover && "text-muted-foreground"
                              )}>
                                {pkg.name}
                              </p>
                              
                              {/* Riga 2: Lezioni disponibili */}
                              <p className="text-sm text-muted-foreground">
                                {kpi.available} / {kpi.total} lezioni disponibili
                              </p>
                              
                              {/* Riga 3: Scadenza */}
                              {pkg.expires_at && (
                                <p className="text-sm text-muted-foreground">
                                  Scade il {format(new Date(pkg.expires_at), "d MMM yyyy", { locale: it })}
                                </p>
                              )}
                              
                              {/* Riga 4: Stato rispetto all'evento (solo per ricorrenze) */}
                              {recurrence.enabled && occurrences.length > 0 && (
                                <>
                                  {!hasSufficientCredits && (
                                    <p className="text-xs text-amber-600 font-medium">
                                      ⚠ Insufficiente — servono {occurrences.length} lezioni
                                    </p>
                                  )}
                                  {hasSufficientCredits && expiresBeforeSeries && (
                                    <p className="text-xs text-destructive font-medium">
                                      ⚠ Scade prima della fine serie
                                    </p>
                                  )}
                                  {canCover && (
                                    <p className="text-xs text-green-600 font-medium">
                                      ✓ Copre tutte le {occurrences.length} occorrenze
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Campi secondari: Luogo, Promemoria, Note - spacing più contenuto */}
            <div className="space-y-4 pt-2">
              {/* Luogo */}
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-sm font-medium text-foreground">Luogo</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Es: Studio, Online, Palestra"
                  className="h-10"
                />
              </div>

              {/* Promemoria */}
              <div className="space-y-1.5">
                <Label htmlFor="reminder" className="text-sm font-medium text-foreground">Promemoria</Label>
                <Select
                  value={formData.reminderOffset?.toString() || "0"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, reminderOffset: parseInt(value) || undefined }))}
                >
                  <SelectTrigger id="reminder" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Nessuno</SelectItem>
                    <SelectItem value="15">15 minuti prima</SelectItem>
                    <SelectItem value="60">1 ora prima</SelectItem>
                    <SelectItem value="1440">1 giorno prima</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Note Interne - visivamente più leggero */}
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-sm font-medium text-foreground">Note interne</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Aggiungi note per questa sessione..."
                  className="min-h-[88px] max-h-[140px] resize-y text-sm"
                />
              </div>
            </div>

            {/* Warnings */}
            {overlappingEvents.length > 0 && (
              <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  Questo appuntamento si sovrappone con {overlappingEvents.length} altro{overlappingEvents.length > 1 ? 'i' : ''} evento{overlappingEvents.length > 1 ? 'i' : ''}
                </AlertDescription>
              </Alert>
            )}


            </div>
            )}
            </div>
          </div>

          {/* Footer - clean spacing, no heavy divider */}
          <DialogFooter className="px-6 py-4 border-t border-border/20 flex-shrink-0 flex items-center justify-between bg-background">
            {viewMode === 'view' && (
              <div className="flex items-center justify-between w-full">
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteDialog(true)}
                  className="h-10 px-4 text-destructive/80 hover:text-destructive hover:bg-destructive/5 font-normal"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancella
                </Button>
                <div className="flex items-center gap-2">
                  {canStartSession && event && new Date(event.end_at) >= new Date() && (
                    <Button variant="outline" onClick={handleStartSession} className="h-10 px-4">
                      <Play className="h-4 w-4 mr-2" />
                      Avvia sessione
                    </Button>
                  )}
                  <Button
                    onClick={() => setViewMode('edit')}
                    className="h-10 px-5"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifica
                  </Button>
                </div>
              </div>
            )}
              
              {/* Edit Mode Footer */}
              {viewMode === 'edit' && (
                <div className="flex items-center justify-between w-full">
                  <Button
                    variant="ghost"
                    onClick={() => setShowDeleteDialog(true)}
                    className="h-10 px-4 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancella
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setViewMode('view')}
                      className="h-10 px-4"
                    >
                      Annulla
                    </Button>
                    {canStartSession && (
                      <Button onClick={handleStartSession} variant="secondary" className="h-10 px-4">
                        <Play className="h-4 w-4 mr-2" />
                        Avvia sessione
                      </Button>
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              onClick={handleUpdate}
                              disabled={!isValid || updateEvent.isPending}
                              className="h-10 px-5 font-semibold"
                            >
                              {updateEvent.isPending ? 'Salvataggio...' : 'Salva modifiche'}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {validationMessage && (
                          <TooltipContent>
                            <p>{validationMessage}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              )}
              
              {/* New Mode Footer */}
              {viewMode === 'new' && (
                <div className="flex items-center justify-end w-full gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    className="h-10 px-4"
                  >
                    Annulla
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            onClick={handleCreate}
                            disabled={!isValid || createEvent.isPending}
                            className="h-10 px-5 font-semibold"
                          >
                            {createEvent.isPending ? 'Salvataggio...' : 'Crea appuntamento'}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {validationMessage && (
                        <TooltipContent>
                          <p>{validationMessage}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancellare questo appuntamento?</AlertDialogTitle>
            <AlertDialogDescription>
              L'evento verrà annullato. Se associato a un pacchetto, la sessione verrà restituita automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? "Cancellazione..." : "Cancella evento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Session Conflict Dialog */}
      <AlertDialog open={showSessionConflictDialog} onOpenChange={setShowSessionConflictDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sessione già in corso</AlertDialogTitle>
            <AlertDialogDescription>
              Hai già una sessione in corso con {activeSession?.client_name}.
              <br />
              Per avviare una nuova sessione, devi prima completare o annullare quella attuale.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Chiudi</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSessionConflictResolve("return")}>
              Vai alla sessione in corso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
}
