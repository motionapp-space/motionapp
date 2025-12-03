import { useState, useEffect, useMemo } from "react";
import { format, addMinutes, differenceInMinutes, isWithinInterval, startOfDay, setHours, setMinutes } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar as CalendarIcon, AlertTriangle, Info, AlertCircle, Trash2, Play, Pencil, MapPin, Clock, User, UserCircle, Bell, FileText, Package } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateEvent } from "../hooks/useCreateEvent";
import { useUpdateEvent } from "../hooks/useUpdateEvent";
import { useDeleteEvent } from "../hooks/useDeleteEvent";
import { useClientsQuery } from "@/features/clients/hooks/useClientsQuery";
import { useClientPackages } from "@/features/packages/hooks/useClientPackages";
import { useEventsQuery } from "../hooks/useEventsQuery";
import { calculatePackageKPI } from "@/features/packages/utils/kpi";
import { generateRecurrenceOccurrences } from "../utils/recurrence";
import { RecurrenceSection, type RecurrenceConfig } from "./RecurrenceSection";
import { handleEventConfirm } from "@/features/packages/api/calendar-integration.api";
import { useCreateSingleLesson } from "@/features/packages/hooks/useCreateSingleLesson";
import { SingleLessonDialog } from "@/features/packages/components/SingleLessonDialog";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { EventWithClient, Event } from "../types";
import { Badge } from "@/components/ui/badge";
import { useBookingSettingsQuery } from "@/features/bookings/hooks/useBookingSettingsQuery";

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

// Helper function to round time to nearest 5 minutes
function roundToNearest5Minutes(date: Date): string {
  const minutes = Math.ceil(date.getMinutes() / 5) * 5;
  const hours = date.getHours() + Math.floor(minutes / 60);
  const roundedMinutes = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
}

// Generate time slots with 5-minute intervals
function generateTimeSlots() {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

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

  // Form state
  const [formData, setFormData] = useState({
    title: event?.title || 'Allenamento',
    clientId: lockedClientId || event?.client_id || '',
    location: event?.location || '',
    date: defaultDate,
    startTime: format(defaultStartTime, 'HH:mm'),
    endTime: format(defaultEndTime, 'HH:mm'),
    reminderOffset: event?.reminder_offset_minutes ?? 15,
    notes: event?.notes || ''
  });

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

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'new' | 'view' | 'edit'>(isNewMode ? 'new' : 'view');
  
  // Single lesson dialog state
  const [showSingleLessonDialog, setShowSingleLessonDialog] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<Event | null>(null);

  // Hooks
  const queryClient = useQueryClient();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const createSingleLesson = useCreateSingleLesson();
  const { data: clientsData } = useClientsQuery({ q: "", page: 1, limit: 100 });
  const clients = clientsData?.items || [];
  const { data: clientPackages } = useClientPackages(formData.clientId);
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
          // Round current time to nearest 5 minutes
          defaultStart = roundToNearest5Minutes(now);
          
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
          endType: "never",
          endDate: undefined,
          occurrenceCount: 10
        });
      } else if (event) {
        setFormData({
          title: event.title || 'Allenamento',
          clientId: event.client_id,
          location: event.location || '',
          date: new Date(event.start_at),
          startTime: format(new Date(event.start_at), 'HH:mm'),
          endTime: format(new Date(event.end_at), 'HH:mm'),
          reminderOffset: event.reminder_offset_minutes ?? 15,
          notes: event.notes || ''
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

  // Calculate occurrences for recurrence
  const occurrences = useMemo(() => {
    if (!recurrence.enabled) return [];
    return generateRecurrenceOccurrences({
      startDate: eventStartDateTime,
      config: recurrence,
    });
  }, [recurrence, eventStartDateTime]);

  // Validation
  const isValid = useMemo(() => {
    if (!formData.title.trim()) return false;
    if (!formData.clientId) return false;
    
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    
    if (endMins <= startMins) return false;
    
    // If recurring, check credits
    if (recurrence.enabled && occurrences.length > availableCredits) {
      return false;
    }
    
    return true;
  }, [formData, recurrence, occurrences, availableCredits]);

  // Validation message for tooltip
  const validationMessage = useMemo(() => {
    if (!formData.title.trim()) return "Inserisci un titolo";
    if (!formData.clientId) return "Seleziona un cliente";
    
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    
    if (endMins <= startMins) return "L'ora di fine deve essere successiva all'ora di inizio";
    
    if (recurrence.enabled && occurrences.length > availableCredits) {
      return `Crediti insufficienti (${availableCredits} disponibili, ${occurrences.length} richiesti)`;
    }
    
    return null;
  }, [formData, recurrence, occurrences, availableCredits]);

  // Handlers for SingleLessonDialog
  const handleConfirmSingleLesson = async () => {
    if (!pendingEvent) return;
    
    await createSingleLesson.mutateAsync({
      eventId: pendingEvent.id,
      clientId: pendingEvent.client_id,
      eventStartAt: pendingEvent.start_at
    });
    
    setShowSingleLessonDialog(false);
    setPendingEvent(null);
    onOpenChange(false);
  };

  const handleConfirmWithoutPackage = () => {
    setShowSingleLessonDialog(false);
    setPendingEvent(null);
    onOpenChange(false);
    toast.info("Appuntamento creato senza pacchetto");
  };

  // Handlers
  const handleCreate = async () => {
    if (!isValid) return;

    try {
      const basePayload = {
        coach_id: coachId,
        client_id: formData.clientId,
        title: formData.title,
        location: formData.location || null,
        reminder_offset_minutes: formData.reminderOffset || null,
        notes: formData.notes || null,
      };

      if (recurrence.enabled && occurrences.length > 0) {
        // Create recurring events
        toast.info(`Creazione di ${occurrences.length} appuntamenti ricorrenti...`);
        
        const [startH, startM] = formData.startTime.split(':').map(Number);
        const [endH, endM] = formData.endTime.split(':').map(Number);

        for (const occurrenceDate of occurrences) {
          const startAt = setMinutes(setHours(startOfDay(occurrenceDate), startH), startM);
          const endAt = setMinutes(setHours(startOfDay(occurrenceDate), endH), endM);

          const event = await createEvent.mutateAsync({
            ...basePayload,
            start_at: startAt.toISOString(),
            end_at: endAt.toISOString(),
          });

          // Try to confirm each recurring event with package
          if (event.client_id) {
            try {
              await handleEventConfirm(event.id, event.client_id, event.start_at);
            } catch (err) {
              // Silent fail for recurring - package might run out of credits
              console.warn('Could not confirm recurring event:', err);
            }
          }
        }

        queryClient.invalidateQueries({ queryKey: ["packages"] });
        toast.success(`Creati ${occurrences.length} appuntamenti ricorrenti`);
        onOpenChange(false);
      } else {
        // Create single event
        const event = await createEvent.mutateAsync({
          ...basePayload,
          start_at: eventStartDateTime.toISOString(),
          end_at: eventEndDateTime.toISOString(),
        });

        // If there's a client, try to confirm with package hold
        if (event.client_id) {
          try {
            const result = await handleEventConfirm(
              event.id,
              event.client_id,
              event.start_at
            );

            if (!result) {
              // No active package - show dialog for explicit coach decision
              setPendingEvent(event);
              setShowSingleLessonDialog(true);
              return; // Don't close main modal yet
            }

            // Package found, hold created
            queryClient.invalidateQueries({ queryKey: ["packages"] });
            toast.success("Appuntamento creato", {
              description: "1 credito prenotato dal pacchetto",
            });
          } catch (error: any) {
            // Error during package confirmation (expired, suspended, etc.)
            toast.warning("Appuntamento creato senza gestione crediti", {
              description: error.message,
            });
          }
        } else {
          toast.success("Appuntamento creato");
        }

        onOpenChange(false);
      }
    } catch (error) {
      // Error is handled by useCreateEvent onError
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

  const handleDelete = async () => {
    if (!event) return;

    try {
      await deleteEvent.mutateAsync(event.id);
      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Delete event error:', error);
    }
  };

  const handleStartSession = () => {
    if (event && onStartSession) {
      onStartSession(
        event.client_id,
        event.id,
        event.linked_plan_id || undefined,
        event.linked_day_id || undefined
      );
    }
  };

  const canStartSession = isEditMode && !!event && !!onStartSession;

  // Determina lo stato dell'appuntamento per il badge
  const getEventStatusBadge = () => {
    if (!event) return null;
    
    const now = new Date();
    const eventEnd = new Date(event.end_at);
    
    // Completato se end_at è nel passato
    if (eventEnd < now) {
      return (
        <Badge className="bg-gray-100 text-gray-700 border-gray-300 text-xs">
          Completato
        </Badge>
      );
    }
    
    // Da confermare se creato dal cliente con approvazione manuale
    if (event.source === 'client' && bookingSettings?.approval_mode === 'MANUAL' && event.session_status === 'scheduled') {
      return (
        <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
          Da confermare
        </Badge>
      );
    }
    
    // Confermato in tutti gli altri casi
    return (
      <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
        Confermato
      </Badge>
    );
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
          {/* Header */}
          <DialogHeader className="border-b border-border/50 px-8 py-3 min-h-[64px] flex-row items-start justify-between gap-4 flex-shrink-0 space-y-0">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="h-[18px] w-[18px] text-primary flex-shrink-0" />
                <DialogTitle className="text-xl font-semibold leading-tight">
                  {viewMode === 'view' ? formData.title : (viewMode === 'edit' ? 'Modifica appuntamento' : 'Nuovo appuntamento')}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {viewMode === 'view' 
                    ? `Dettagli appuntamento: ${formData.title}` 
                    : viewMode === 'edit' 
                      ? 'Modifica i dettagli dell\'appuntamento' 
                      : 'Crea un nuovo appuntamento con un cliente'}
                </DialogDescription>
              </div>
              {viewMode === 'view' && (
                <div className="flex items-center gap-2 flex-wrap pl-[26px]">
                  {/* Badge Stato */}
                  {getEventStatusBadge()}
                  {/* Badge Ricorrente */}
                  {event?.recurrence_rule && (
                    <Badge variant="outline" className="text-xs">
                      Ricorrente
                    </Badge>
                  )}
                </div>
              )}
            </div>
            {viewMode === 'view' && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('edit')}
                  className="h-9 w-9"
                  aria-label="Modifica appuntamento"
                >
                  <Pencil className="h-[18px] w-[18px]" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                  className="h-9 w-9 text-destructive hover:text-destructive"
                  aria-label="Elimina appuntamento"
                >
                  <Trash2 className="h-[18px] w-[18px]" />
                </Button>
              </div>
            )}
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-8 py-4">
            
            {/* READ-ONLY VIEW */}
            {viewMode === 'view' && event && (
              <div className="space-y-4">
                {/* Data & Orario - UNA SOLA RIGA */}
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Data e ora</p>
                    <p className="text-base text-foreground">
                      {format(formData.date, "EEEE d MMMM", { locale: it })} • {formData.startTime} – {formData.endTime}
                      <span className="text-muted-foreground ml-1.5">({duration})</span>
                    </p>
                  </div>
                </div>

                {/* Cliente - CLICCABILE */}
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <button
                      onClick={() => {
                        onOpenChange(false);
                        window.location.href = `/clients/${formData.clientId}`;
                      }}
                      className="text-base text-primary hover:underline text-left"
                    >
                      {clients.find(c => c.id === formData.clientId)?.first_name} {clients.find(c => c.id === formData.clientId)?.last_name}
                    </button>
                  </div>
                </div>

                {/* Creato da */}
                <div className="flex items-start gap-2">
                  <UserCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Creato da</p>
                    <p className="text-base text-foreground">{getCreatedByText()}</p>
                  </div>
                </div>

                {/* Luogo (se presente) */}
                {formData.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Luogo</p>
                      <p className="text-base text-foreground">{formData.location}</p>
                    </div>
                  </div>
                )}

                {/* Promemoria (se presente) */}
                {formData.reminderOffset && formData.reminderOffset > 0 && (
                  <div className="flex items-start gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Promemoria</p>
                      <p className="text-base text-foreground">
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
                  <div className="flex items-start gap-2">
                    <Package className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Pacchetto</p>
                      <p className="text-base text-foreground">
                        {calculatePackageKPI(activePackage).available}/{activePackage.total_sessions} sessioni rimanenti
                      </p>
                    </div>
                  </div>
                )}

                {/* Note interne (se presenti) */}
                {formData.notes && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Note interne</p>
                      <div className="rounded-md bg-muted p-3 mt-1">
                        <p className="text-sm text-foreground whitespace-pre-wrap">{formData.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* EDIT/NEW FORM */}
            {(viewMode === 'new' || viewMode === 'edit') && (
              <div className="space-y-4">
            {/* Dettagli Principali */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Titolo <span className="ml-1">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Aggiungi un titolo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">
                  Cliente <span className="ml-1">*</span>
                </Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
                  disabled={!!lockedClientId}
                >
                  <SelectTrigger id="client">
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

            </div>

            {/* Data, Orari e Durata */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Data */}
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
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
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? format(formData.date, "PPP", { locale: it }) : "Seleziona data"}
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
                <div className="space-y-2">
                  <Label htmlFor="start-time">Dalle</Label>
                  <Select 
                    value={formData.startTime} 
                    onValueChange={(value) => {
                      // When start time changes, automatically update end time based on duration
                      const duration = bookingSettings?.slot_duration_minutes || 45;
                      const [h, m] = value.split(':').map(Number);
                      const startDate = setMinutes(setHours(new Date(), h), m);
                      const endDate = addMinutes(startDate, duration);
                      const endTime = format(endDate, 'HH:mm');
                      
                      setFormData(prev => ({ 
                        ...prev, 
                        startTime: value,
                        endTime: endTime
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
                <div className="space-y-2">
                  <Label htmlFor="end-time">Alle</Label>
                  <Select value={formData.endTime} onValueChange={(value) => setFormData(prev => ({ ...prev, endTime: value }))}>
                    <SelectTrigger id="end-time" className="h-10">
                      <SelectValue placeholder="Fine" />
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
              </div>

              {/* Durata calcolata */}
              <div className="text-xs text-muted-foreground">
                Durata: {duration}
              </div>
            </div>

            {/* Ricorrenza (solo in modalità new) */}
            {isNewMode && (
              <RecurrenceSection
                config={recurrence}
                onChange={setRecurrence}
                startDate={formData.date}
                maxOccurrences={availableCredits}
                onMaxOccurrencesExceeded={() => {
                  toast.error(
                    `Il cliente ha solo ${availableCredits} sessioni disponibili nel pacchetto`,
                    { duration: 4000 }
                  );
                }}
              />
            )}

            {/* Luogo */}
            <div className="space-y-2">
              <Label htmlFor="location">Luogo</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Es: Studio, Online, Palestra"
              />
            </div>

            {/* Promemoria */}
            <div className="space-y-2">
              <Label htmlFor="reminder" className="text-sm font-medium">Promemoria</Label>
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

            {/* Note Interne */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">Note interne</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Aggiungi note per questa sessione..."
                className="min-h-[80px] max-h-[160px] resize-y"
              />
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

            {formData.clientId && !activePackage && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Il cliente non ha un pacchetto attivo
                </AlertDescription>
              </Alert>
            )}

            {recurrence.enabled && occurrences.length > availableCredits && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Crediti insufficienti: {occurrences.length} richiesti, {availableCredits} disponibili. 
                  Riduci il numero di occorrenze o aggiungi sessioni al pacchetto.
                </AlertDescription>
              </Alert>
            )}
            </div>
            )}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="border-t px-8 py-4 bg-background sticky bottom-0 z-10 flex-shrink-0 min-h-[64px] flex items-center justify-between">
            {viewMode === 'view' && (
              <div className="flex items-center justify-between w-full">
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="h-10"
                >
                  Chiudi
                </Button>
                <div className="flex items-center gap-2">
                  {canStartSession && event && new Date(event.end_at) >= new Date() && (
                    <Button onClick={handleStartSession} className="h-10">
                      <Play className="h-4 w-4 mr-2" />
                      Avvia sessione
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setViewMode('edit')}
                    className="h-10"
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
                    className="h-10 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Elimina
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setViewMode('view')}
                      className="h-10"
                    >
                      Annulla
                    </Button>
                    {canStartSession && (
                      <Button onClick={handleStartSession} variant="secondary" className="h-10">
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
                              className="h-10"
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
                <div className="flex items-center justify-between w-full">
                  <div />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      className="h-10"
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
                              className="h-10"
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
                </div>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo appuntamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. L'appuntamento verrà eliminato definitivamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Lesson Dialog - shown when no active package exists */}
      <SingleLessonDialog
        open={showSingleLessonDialog}
        onOpenChange={setShowSingleLessonDialog}
        clientName={clients?.find(c => c.id === pendingEvent?.client_id)?.first_name + ' ' + clients?.find(c => c.id === pendingEvent?.client_id)?.last_name || ""}
        onConfirmSingleLesson={handleConfirmSingleLesson}
        onConfirmWithoutPackage={handleConfirmWithoutPackage}
        isLoading={createSingleLesson.isPending}
      />
    </>
  );
}
