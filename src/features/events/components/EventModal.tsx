import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, parseISO, addMinutes, differenceInMinutes, addDays, startOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { useClientsQuery } from "@/features/clients/hooks/useClientsQuery";
import { useCreateEvent } from "../hooks/useCreateEvent";
import { useUpdateEvent } from "../hooks/useUpdateEvent";
import { useDeleteEvent } from "../hooks/useDeleteEvent";
import { useBookingSettingsQuery } from "@/features/bookings/hooks/useBookingSettings";
import { useAvailabilityWindowsQuery } from "@/features/bookings/hooks/useAvailability";
import { useOutOfOfficeBlocksQuery } from "@/features/bookings/hooks/useOutOfOffice";
import { useEventsQuery } from "../hooks/useEventsQuery";
import { snapToSlot, hasConflict, isWithinAvailability } from "@/features/bookings/utils/slot-snap";
import { generateAvailableSlots } from "@/features/bookings/utils/slot-generator";
import { AlertCircle, Trash2, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { EventWithClient } from "../types";

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: EventWithClient;
  prefillData?: {
    start: Date;
    end: Date;
    clientId?: string;
  };
  lockedClientId?: string;
  onStartSession?: (clientId: string, eventId: string, linkedPlanId?: string, linkedDayId?: string) => void;
}

export function EventModal({ open, onOpenChange, event, prefillData, lockedClientId, onStartSession }: EventModalProps) {
  const isEdit = !!event;
  const { data: clientsData } = useClientsQuery({ limit: 1000 });
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  const { data: bookingSettings } = useBookingSettingsQuery();
  const { data: availabilityWindows = [] } = useAvailabilityWindowsQuery();
  const { data: outOfOfficeBlocks = [] } = useOutOfOfficeBlocksQuery();
  const { data: existingEvents = [] } = useEventsQuery({});

  const [formData, setFormData] = useState({
    title: "",
    client_id: "",
    location: "",
    start_at: "",
    end_at: "",
    notes: "",
    is_all_day: false,
    reminder_offset_minutes: 0,
    align_to_slot: true,
    allow_exception: false,
    duration_minutes: 60, // default, will be overridden by settings
    custom_duration: "",
  });

  const [savedTimeValues, setSavedTimeValues] = useState({ start: "", end: "" });
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [snapInfo, setSnapInfo] = useState<string | null>(null);
  
  // Dirty flags to track manual end time/date overrides
  const endTimeDirtyRef = useRef(false);
  const endDateDirtyRef = useRef(false);

  // Initialize duration from settings or event
  useEffect(() => {
    if (open) {
      const defaultDuration = bookingSettings?.slot_duration_minutes || 60;
      
      if (event) {
        const startFormatted = format(parseISO(event.start_at), "yyyy-MM-dd'T'HH:mm");
        const endFormatted = format(parseISO(event.end_at), "yyyy-MM-dd'T'HH:mm");
        const eventDuration = differenceInMinutes(parseISO(event.end_at), parseISO(event.start_at));
        
        setFormData({
          title: event.title,
          client_id: event.client_id,
          location: event.location || "",
          start_at: startFormatted,
          end_at: endFormatted,
          notes: event.notes || "",
          is_all_day: event.is_all_day || false,
          reminder_offset_minutes: event.reminder_offset_minutes || 0,
          align_to_slot: event.source === 'manual' ? false : (event.aligned_to_slot ?? true),
          allow_exception: event.source === 'manual',
          duration_minutes: [30, 45, 60].includes(eventDuration) ? eventDuration : 0,
          custom_duration: [30, 45, 60].includes(eventDuration) ? "" : eventDuration.toString(),
        });
        setSavedTimeValues({ start: startFormatted, end: endFormatted });
      } else if (prefillData) {
        const startFormatted = format(prefillData.start, "yyyy-MM-dd'T'HH:mm");
        const endFormatted = format(prefillData.end, "yyyy-MM-dd'T'HH:mm");
        setFormData({
          title: "",
          client_id: lockedClientId || prefillData.clientId || "",
          location: "",
          start_at: startFormatted,
          end_at: endFormatted,
          notes: "",
          is_all_day: false,
          reminder_offset_minutes: 0,
          align_to_slot: true,
          allow_exception: false,
          duration_minutes: defaultDuration,
          custom_duration: "",
        });
        setSavedTimeValues({ start: startFormatted, end: endFormatted });
      } else {
        setFormData({
          title: "",
          client_id: lockedClientId || "",
          location: "",
          start_at: "",
          end_at: "",
          notes: "",
          is_all_day: false,
          reminder_offset_minutes: 0,
          align_to_slot: true,
          allow_exception: false,
          duration_minutes: defaultDuration,
          custom_duration: "",
        });
        setSavedTimeValues({ start: "", end: "" });
      }
      setErrors([]);
      setWarnings([]);
      setSnapInfo(null);
      endTimeDirtyRef.current = false;
      endDateDirtyRef.current = false;
    }
  }, [event, prefillData, lockedClientId, open, bookingSettings]);

  const handleStartChange = (value: string) => {
    if (!value) return;
    
    const startDate = new Date(value);
    setSavedTimeValues((prev) => ({ ...prev, start: value }));
    
    if (!formData.is_all_day) {
      // Auto-calculate end based on duration if not manually overridden
      if (!endTimeDirtyRef.current || formData.align_to_slot) {
        const duration = formData.duration_minutes === 0 
          ? parseInt(formData.custom_duration || "60") 
          : formData.duration_minutes;
        const endDate = addMinutes(startDate, duration);
        const endValue = format(endDate, "yyyy-MM-dd'T'HH:mm");
        setSavedTimeValues((prev) => ({ ...prev, end: endValue }));
        setFormData({ ...formData, start_at: value, end_at: endValue });
      } else {
        setFormData({ ...formData, start_at: value });
      }
    } else {
      const dateOnly = format(startDate, "yyyy-MM-dd");
      if (!endDateDirtyRef.current) {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        const endDateOnly = format(endDate, "yyyy-MM-dd");
        setFormData({ ...formData, start_at: dateOnly, end_at: endDateOnly });
      } else {
        setFormData({ ...formData, start_at: dateOnly });
      }
    }
  };

  const handleEndChange = (value: string) => {
    if (!value) return;
    
    // Mark as manually overridden
    if (!formData.is_all_day) {
      endTimeDirtyRef.current = true;
    } else {
      endDateDirtyRef.current = true;
    }
    
    setSavedTimeValues((prev) => ({ ...prev, end: value }));
    setFormData({ ...formData, end_at: value });
  };

  const handleDurationChange = (value: string) => {
    const minutes = value === "custom" ? 0 : parseInt(value);
    setFormData({ ...formData, duration_minutes: minutes });
    
    // Recalculate end time if start is set
    if (formData.start_at && !formData.is_all_day) {
      const duration = minutes === 0 
        ? parseInt(formData.custom_duration || "60") 
        : minutes;
      const startDate = new Date(formData.start_at);
      const endDate = addMinutes(startDate, duration);
      const endValue = format(endDate, "yyyy-MM-dd'T'HH:mm");
      setSavedTimeValues((prev) => ({ ...prev, end: endValue }));
      setFormData((prev) => ({ ...prev, end_at: endValue, duration_minutes: minutes }));
    }
  };

  const handleCustomDurationChange = (value: string) => {
    const minutes = parseInt(value) || 0;
    setFormData({ ...formData, custom_duration: value });
    
    // Recalculate end time if start is set and it's a valid number
    if (formData.start_at && !formData.is_all_day && minutes > 0) {
      const startDate = new Date(formData.start_at);
      const endDate = addMinutes(startDate, minutes);
      const endValue = format(endDate, "yyyy-MM-dd'T'HH:mm");
      setSavedTimeValues((prev) => ({ ...prev, end: endValue }));
      setFormData((prev) => ({ ...prev, end_at: endValue }));
    }
  };

  const handleAllDayToggle = (checked: boolean) => {
    endTimeDirtyRef.current = false;
    endDateDirtyRef.current = false;
    
    if (checked) {
      const dateOnly = formData.start_at ? formData.start_at.split('T')[0] : format(new Date(), "yyyy-MM-dd");
      const endDate = new Date(dateOnly);
      endDate.setDate(endDate.getDate() + 1);
      const endDateOnly = format(endDate, "yyyy-MM-dd");
      setFormData({ ...formData, is_all_day: true, start_at: dateOnly, end_at: endDateOnly });
    } else {
      const start = savedTimeValues.start || format(new Date(), "yyyy-MM-dd'T'HH:mm");
      const duration = formData.duration_minutes === 0 
        ? parseInt(formData.custom_duration || "60") 
        : formData.duration_minutes;
      const end = savedTimeValues.end || format(addMinutes(new Date(start), duration), "yyyy-MM-dd'T'HH:mm");
      setFormData({ ...formData, is_all_day: false, start_at: start, end_at: end });
    }
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];
    let suggestedSlotInfo: string | null = null;

    if (!formData.title.trim()) {
      newErrors.push("Il titolo è obbligatorio");
    }
    if (!formData.client_id) {
      newErrors.push("Seleziona un cliente");
    }
    if (!formData.start_at) {
      newErrors.push("Data e ora di inizio obbligatoria");
    }
    if (!formData.end_at) {
      newErrors.push("Data e ora di fine obbligatoria");
    }

    // Validate duration
    const duration = formData.duration_minutes === 0 
      ? parseInt(formData.custom_duration || "0") 
      : formData.duration_minutes;
    
    if (duration <= 0 && !formData.is_all_day) {
      newErrors.push("La durata deve essere maggiore di 0");
    }
    if (duration > 720 && !formData.is_all_day) {
      newErrors.push("La durata massima è 12 ore (720 minuti)");
    }

    if (formData.start_at && formData.end_at && !formData.is_all_day) {
      const start = new Date(formData.start_at);
      const end = new Date(formData.end_at);
      
      if (end <= start) {
        newErrors.push("La data di fine deve essere dopo quella di inizio");
      }
      if (start < new Date()) {
        newWarnings.push("⚠️ Attenzione: stai creando un appuntamento nel passato");
      }

      // Check conflicts
      const conflict = hasConflict(
        start,
        end,
        existingEvents.filter(e => !event || e.id !== event.id),
        outOfOfficeBlocks
      );

      if (conflict.hasConflict && !formData.allow_exception) {
        newErrors.push(conflict.reason || "Conflitto con eventi esistenti");
      }

      // Check if within availability
      if (availabilityWindows.length > 0 && !formData.allow_exception) {
        const withinAvailability = isWithinAvailability(start, end, availabilityWindows);
        if (!withinAvailability) {
          newWarnings.push("⚠️ L'orario è fuori dalla disponibilità configurata");
        }
      }

      // Try to snap if enabled
      if (formData.align_to_slot && bookingSettings) {
        const snapResult = snapToSlot({
          requestedStart: start,
          requestedEnd: end,
          availabilityWindows,
          existingEvents: existingEvents.filter(e => !event || e.id !== event.id),
          outOfOfficeBlocks,
          slotDurationMinutes: bookingSettings.slot_duration_minutes,
          bufferBetweenMinutes: bookingSettings.buffer_between_minutes || 0,
          minAdvanceNoticeHours: bookingSettings.min_advance_notice_hours,
        });

        if (snapResult.snapped && snapResult.slot) {
          const slotStart = format(parseISO(snapResult.slot.start), "HH:mm");
          const slotEnd = format(parseISO(snapResult.slot.end), "HH:mm");
          const slotDuration = differenceInMinutes(parseISO(snapResult.slot.end), parseISO(snapResult.slot.start));
          suggestedSlotInfo = `Questo appuntamento verrà creato nello slot ${slotStart}–${slotEnd} (${slotDuration} min)`;
        } else {
          // No exact snap found, find next available slots
          if (bookingSettings) {
            const nextSlots: string[] = [];
            let searchDate = startOfDay(start);
            const maxSearchDays = 7;
            
            for (let i = 0; i < maxSearchDays && nextSlots.length === 0; i++) {
              const daySlots = generateAvailableSlots({
                date: searchDate,
                slotDurationMinutes: bookingSettings.slot_duration_minutes,
                bufferBetweenMinutes: bookingSettings.buffer_between_minutes || 0,
                minAdvanceNoticeHours: bookingSettings.min_advance_notice_hours,
                availabilityWindows,
                outOfOfficeBlocks,
                existingEvents: existingEvents.filter(e => !event || e.id !== event.id),
              });
              
              if (daySlots.length > 0) {
                const firstSlot = daySlots[0];
                const slotDate = format(parseISO(firstSlot.start), "dd/MM");
                const slotTime = format(parseISO(firstSlot.start), "HH:mm");
                nextSlots.push(`${slotDate} alle ${slotTime}`);
              }
              
              searchDate = addDays(searchDate, 1);
            }
            
            if (nextSlots.length > 0) {
              newWarnings.push(`⚠️ Nessuno slot disponibile per questo orario. Primo slot disponibile: ${nextSlots[0]}`);
            } else {
              newWarnings.push(`⚠️ Nessuno slot disponibile nei prossimi ${maxSearchDays} giorni`);
            }
          }
        }
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    setSnapInfo(suggestedSlotInfo);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    let finalStartAt = new Date(formData.start_at);
    let finalEndAt = new Date(formData.end_at);

    // Snap to slot if enabled and not all-day
    if (formData.align_to_slot && bookingSettings && !formData.is_all_day) {
      const snapResult = snapToSlot({
        requestedStart: finalStartAt,
        requestedEnd: finalEndAt,
        availabilityWindows,
        existingEvents: existingEvents.filter(e => !event || e.id !== event.id),
        outOfOfficeBlocks,
        slotDurationMinutes: bookingSettings.slot_duration_minutes,
        bufferBetweenMinutes: bookingSettings.buffer_between_minutes || 0,
        minAdvanceNoticeHours: bookingSettings.min_advance_notice_hours,
      });

      if (snapResult.snapped && snapResult.slot) {
        finalStartAt = parseISO(snapResult.slot.start);
        finalEndAt = parseISO(snapResult.slot.end);
      }
    }

    if (formData.is_all_day) {
      finalStartAt.setHours(0, 0, 0, 0);
      finalEndAt.setHours(23, 59, 59, 999);
    }

    const data = {
      title: formData.title,
      client_id: formData.client_id,
      location: formData.location || undefined,
      start_at: finalStartAt.toISOString(),
      end_at: finalEndAt.toISOString(),
      notes: formData.notes || undefined,
      is_all_day: formData.is_all_day,
      reminder_offset_minutes: formData.reminder_offset_minutes || undefined,
      aligned_to_slot: formData.align_to_slot && !formData.allow_exception,
      source: formData.allow_exception ? 'manual' as const : 'manual' as const,
    };

    if (isEdit) {
      await updateMutation.mutateAsync({ id: event.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!event) return;
    if (confirm("Eliminare questo appuntamento?")) {
      await deleteMutation.mutateAsync(event.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {isEdit ? "Modifica appuntamento" : "Nuovo appuntamento"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 flex-1 overflow-y-auto pb-4">
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-4 space-y-1">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {warnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-4 space-y-1">
                  {warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {snapInfo && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {snapInfo}
              </AlertDescription>
            </Alert>
          )}

          {/* Sezione Dati principali */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Dati principali</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Titolo *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="es. Consulenza allenamento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                disabled={!!lockedClientId}
              >
                <SelectTrigger id="client">
                  <SelectValue placeholder="Seleziona cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientsData?.items.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sezione Dettagli appuntamento */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground">Dettagli appuntamento</h3>
            
            {!formData.is_all_day ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="start">Inizio *</Label>
                  <DateTimePicker
                    value={formData.start_at}
                    onChange={(value) => handleStartChange(value)}
                    placeholder="Seleziona data e ora"
                  />
                </div>

                <div className="space-y-2">
                  <TooltipProvider>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="duration">Durata *</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Valore predefinito dalle tue impostazioni. Modificalo solo se necessario.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                  <Select
                    value={formData.duration_minutes === 0 ? "custom" : formData.duration_minutes.toString()}
                    onValueChange={handleDurationChange}
                  >
                    <SelectTrigger id="duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minuti</SelectItem>
                      <SelectItem value="45">45 minuti</SelectItem>
                      <SelectItem value="60">60 minuti</SelectItem>
                      <SelectItem value="custom">Personalizzato</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.duration_minutes === 0 && (
                    <Input
                      type="number"
                      min="1"
                      max="720"
                      placeholder="Durata in minuti"
                      value={formData.custom_duration}
                      onChange={(e) => handleCustomDurationChange(e.target.value)}
                      className="mt-2"
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    Impostazione predefinita dalle tue preferenze di prenotazione.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end">Fine *</Label>
                  <DateTimePicker
                    value={formData.end_at}
                    onChange={(value) => handleEndChange(value)}
                    placeholder="Seleziona data e ora"
                    disabled={formData.align_to_slot && !formData.allow_exception}
                  />
                  {formData.align_to_slot && !formData.allow_exception && (
                    <p className="text-xs text-muted-foreground">
                      Calcolato automaticamente in base alla durata
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="align-to-slot"
                      checked={formData.align_to_slot}
                      onCheckedChange={(checked) => {
                        setFormData({ ...formData, align_to_slot: checked });
                        if (checked) {
                          setFormData({ ...formData, align_to_slot: checked, allow_exception: false });
                        }
                      }}
                    />
                    <Label htmlFor="align-to-slot" className="cursor-pointer">
                      Allinea agli slot disponibili
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allow-exception"
                      checked={formData.allow_exception}
                      onCheckedChange={(checked) => {
                        setFormData({ ...formData, allow_exception: checked });
                        if (checked) {
                          setFormData({ ...formData, allow_exception: checked, align_to_slot: false });
                        }
                      }}
                    />
                    <Label htmlFor="allow-exception" className="cursor-pointer text-muted-foreground">
                      Consenti eccezione (fuori disponibilità/slot)
                    </Label>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Data Inizio *</Label>
                  <DatePicker
                    value={formData.start_at}
                    onChange={(value) => handleStartChange(value)}
                    placeholder="Seleziona data"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">Data Fine *</Label>
                  <DatePicker
                    value={formData.end_at}
                    onChange={(value) => handleEndChange(value)}
                    placeholder="Seleziona data"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="all-day"
                checked={formData.is_all_day}
                onCheckedChange={handleAllDayToggle}
              />
              <Label htmlFor="all-day" className="cursor-pointer">
                Tutto il giorno
              </Label>
            </div>
          </div>

          {/* Sezione Luogo & promemoria */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground">Luogo & promemoria</h3>
            <div className="space-y-2">
              <Label htmlFor="location">Luogo</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="es. Palestra, Via Roma 10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder">Promemoria</Label>
              <Select
                value={formData.reminder_offset_minutes.toString()}
                onValueChange={(value) => setFormData({ ...formData, reminder_offset_minutes: parseInt(value) })}
              >
                <SelectTrigger id="reminder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Nessuno</SelectItem>
                  <SelectItem value="15">15 minuti prima</SelectItem>
                  <SelectItem value="30">30 minuti prima</SelectItem>
                  <SelectItem value="60">1 ora prima</SelectItem>
                  <SelectItem value="1440">1 giorno prima</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Note aggiuntive..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex justify-between items-center w-full gap-3">
            {isEdit ? (
              <>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Elimina
                </Button>
                <div className="flex gap-3">
                  {onStartSession && event && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        onStartSession(event.client_id, event.id, event.linked_plan_id, event.linked_day_id);
                        onOpenChange(false);
                      }}
                    >
                      Avvia sessione
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Annulla
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={updateMutation.isPending}
                  >
                    Salva
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex gap-3 ml-auto">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Annulla
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                >
                  Crea
                </Button>
              </div>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
