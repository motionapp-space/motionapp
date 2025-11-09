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
import { format, parseISO, addHours } from "date-fns";
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
import { AlertCircle, Trash2, CheckCircle2 } from "lucide-react";
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
  });

  const [savedTimeValues, setSavedTimeValues] = useState({ start: "", end: "" });
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [snapInfo, setSnapInfo] = useState<string | null>(null);
  
  // Dirty flags to track manual end time/date overrides
  const endTimeDirtyRef = useRef(false);
  const endDateDirtyRef = useRef(false);

  useEffect(() => {
    if (event) {
      const startFormatted = format(parseISO(event.start_at), "yyyy-MM-dd'T'HH:mm");
      const endFormatted = format(parseISO(event.end_at), "yyyy-MM-dd'T'HH:mm");
      setFormData({
        title: event.title,
        client_id: event.client_id,
        location: event.location || "",
        start_at: startFormatted,
        end_at: endFormatted,
        notes: event.notes || "",
        is_all_day: event.is_all_day || false,
        reminder_offset_minutes: event.reminder_offset_minutes || 0,
        align_to_slot: event.aligned_to_slot ?? true,
        allow_exception: false,
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
      });
      setSavedTimeValues({ start: "", end: "" });
    }
    setErrors([]);
    setWarnings([]);
    setSnapInfo(null);
    // Reset dirty flags when modal opens/changes
    endTimeDirtyRef.current = false;
    endDateDirtyRef.current = false;
  }, [event, prefillData, lockedClientId, open]);

  const handleStartChange = (value: string) => {
    if (!value) return;
    
    const startDate = new Date(value);
    setSavedTimeValues((prev) => ({ ...prev, start: value }));
    
    if (!formData.is_all_day) {
      // Auto-set end time to +1 hour if not manually overridden
      if (!endTimeDirtyRef.current) {
        const endDate = addHours(startDate, 1);
        const endValue = format(endDate, "yyyy-MM-dd'T'HH:mm");
        setSavedTimeValues((prev) => ({ ...prev, end: endValue }));
        setFormData({ ...formData, start_at: value, end_at: endValue });
      } else {
        setFormData({ ...formData, start_at: value });
      }
    } else {
      const dateOnly = format(startDate, "yyyy-MM-dd");
      // Auto-set end date to +1 day if not manually overridden
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

  const handleAllDayToggle = (checked: boolean) => {
    // Reset dirty flags when switching modes
    endTimeDirtyRef.current = false;
    endDateDirtyRef.current = false;
    
    if (checked) {
      // Switch to all-day: keep date only, set end to +1 day
      const dateOnly = formData.start_at ? formData.start_at.split('T')[0] : format(new Date(), "yyyy-MM-dd");
      const endDate = new Date(dateOnly);
      endDate.setDate(endDate.getDate() + 1);
      const endDateOnly = format(endDate, "yyyy-MM-dd");
      setFormData({ ...formData, is_all_day: true, start_at: dateOnly, end_at: endDateOnly });
    } else {
      // Switch back to timed: restore saved times or use defaults with +1h
      const start = savedTimeValues.start || format(new Date(), "yyyy-MM-dd'T'HH:mm");
      const end = savedTimeValues.end || format(addHours(new Date(start), 1), "yyyy-MM-dd'T'HH:mm");
      setFormData({ ...formData, is_all_day: false, start_at: start, end_at: end });
    }
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];

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
      if (formData.align_to_slot && bookingSettings && !isEdit) {
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
          setSnapInfo(`✓ Allineato allo slot ${format(parseISO(snapResult.slot.start), "HH:mm")} - ${format(parseISO(snapResult.slot.end), "HH:mm")}`);
        } else if (snapResult.alternatives.length > 0) {
          const altText = snapResult.alternatives
            .slice(0, 2)
            .map(s => format(parseISO(s.start), "HH:mm"))
            .join(", ");
          newWarnings.push(`⚠️ Slot non disponibile. Alternative: ${altText}`);
        }
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    let finalStartAt = new Date(formData.start_at);
    let finalEndAt = new Date(formData.end_at);

    // Snap to slot if enabled and not editing
    if (formData.align_to_slot && bookingSettings && !isEdit && !formData.is_all_day) {
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
      source: 'manual' as const,
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

          {!formData.is_all_day ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Inizio *</Label>
                <DateTimePicker
                  value={formData.start_at}
                  onChange={(value) => handleStartChange(value)}
                  placeholder="Seleziona data e ora"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end">Fine *</Label>
                <DateTimePicker
                  value={formData.end_at}
                  onChange={(value) => handleEndChange(value)}
                  placeholder="Seleziona data e ora"
                />
              </div>
            </div>
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

          <div className="space-y-3">
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

            {!isEdit && !formData.is_all_day && (
              <>
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
              </>
            )}
          </div>

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
