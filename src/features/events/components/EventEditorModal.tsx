import { useState, useEffect, useMemo } from "react";
import { format, addMinutes, differenceInMinutes, isWithinInterval, startOfDay, setHours, setMinutes } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar as CalendarIcon, AlertTriangle, Info, AlertCircle, Trash2, Play } from "lucide-react";
import { useCreateEvent } from "../hooks/useCreateEvent";
import { useUpdateEvent } from "../hooks/useUpdateEvent";
import { useDeleteEvent } from "../hooks/useDeleteEvent";
import { useClientsQuery } from "@/features/clients/hooks/useClientsQuery";
import { useClientPackages } from "@/features/packages/hooks/useClientPackages";
import { useEventsQuery } from "../hooks/useEventsQuery";
import { calculatePackageKPI } from "@/features/packages/utils/kpi";
import { generateRecurrenceOccurrences } from "../utils/recurrence";
import { RecurrenceSection, type RecurrenceConfig } from "./RecurrenceSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import type { EventWithClient } from "../types";

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

// Generate time slots with 15-minute intervals
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

  // Hooks
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { data: clientsData } = useClientsQuery({ q: "", page: 1, limit: 100 });
  const clients = clientsData?.items || [];
  const { data: clientPackages } = useClientPackages(formData.clientId);
  const { data: existingEvents } = useEventsQuery({ 
    start_date: format(formData.date, 'yyyy-MM-dd'),
    end_date: format(addMinutes(formData.date, 1440), 'yyyy-MM-dd')
  });

  // Reset form when opening in new mode or event changes
  useEffect(() => {
    if (open) {
      if (isNewMode) {
        setFormData({
          title: 'Allenamento',
          clientId: lockedClientId || '',
          location: '',
          date: initialDate || new Date(),
          startTime: format(initialStartTime || new Date(), 'HH:mm'),
          endTime: format(initialEndTime || addMinutes(new Date(), 45), 'HH:mm'),
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
  }, [open, mode, event, initialDate, initialStartTime, initialEndTime, lockedClientId, isNewMode]);

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

          await createEvent.mutateAsync({
            ...basePayload,
            start_at: startAt.toISOString(),
            end_at: endAt.toISOString(),
          });
        }

        toast.success(`Creati ${occurrences.length} appuntamenti ricorrenti`);
      } else {
        // Create single event
        await createEvent.mutateAsync({
          ...basePayload,
          start_at: eventStartDateTime.toISOString(),
          end_at: eventEndDateTime.toISOString(),
        });
      }

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[860px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {isEditMode ? 'Modifica appuntamento' : 'Nuovo appuntamento'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Dettagli Principali */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titolo</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Aggiungi un titolo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">
                  Cliente <span className="text-destructive">*</span>
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

              <div className="space-y-2">
                <Label htmlFor="location">Luogo</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Es: Studio, Online, Palestra"
                />
              </div>
            </div>

            {/* Quando */}
            <div className="space-y-4 p-4 rounded-lg border border-border">
              <h3 className="font-semibold">Quando</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
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
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Dalle</Label>
                  <Select
                    value={formData.startTime}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, startTime: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
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

                <div className="space-y-2">
                  <Label>Alle</Label>
                  <Select
                    value={formData.endTime}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, endTime: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
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

              <div className="text-sm text-muted-foreground">
                Durata: <span className="font-medium">{duration}</span>
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

            {/* Promemoria */}
            <div className="space-y-2">
              <Label htmlFor="reminder">Promemoria</Label>
              <Select
                value={formData.reminderOffset?.toString() || "0"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, reminderOffset: parseInt(value) || undefined }))}
              >
                <SelectTrigger id="reminder">
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
              <Label htmlFor="notes">Note interne</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Aggiungi note per questa sessione..."
                rows={3}
                className="resize-none"
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

          <DialogFooter className="sticky bottom-0 bg-background border-t pt-4">
            {isEditMode ? (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Annulla
                </Button>
                {canStartSession && (
                  <Button onClick={handleStartSession}>
                    <Play className="h-4 w-4 mr-2" />
                    Avvia sessione
                  </Button>
                )}
                <Button
                  onClick={handleUpdate}
                  disabled={!isValid || updateEvent.isPending}
                >
                  {updateEvent.isPending ? 'Salvataggio...' : 'Salva modifiche'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Annulla
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!isValid || createEvent.isPending}
                >
                  {createEvent.isPending ? 'Creazione...' : 'Crea appuntamento'}
                </Button>
              </>
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
    </>
  );
}
