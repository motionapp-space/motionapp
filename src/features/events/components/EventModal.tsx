import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, parseISO, addMinutes, differenceInMinutes, startOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { useClientsQuery } from "@/features/clients/hooks/useClientsQuery";
import { useCreateEvent } from "../hooks/useCreateEvent";
import { useUpdateEvent } from "../hooks/useUpdateEvent";
import { useDeleteEvent } from "../hooks/useDeleteEvent";
import { useBookingSettingsQuery } from "@/features/bookings/hooks/useBookingSettings";
import { AlertCircle, Trash2, Info, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { SlotSelector } from "./SlotSelector";
import type { EventWithClient } from "../types";
import type { AvailableSlot } from "@/features/bookings/types";

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
  const [coachId, setCoachId] = useState<string>("");

  // Get coach ID
  useEffect(() => {
    const getCoachId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCoachId(user.id);
    };
    getCoachId();
  }, []);

  const [formData, setFormData] = useState({
    title: "",
    client_id: "",
    location: "",
    start_at: "",
    end_at: "",
    reminder_offset_minutes: 0,
    booking_mode: "slot" as "slot" | "custom",
    duration_minutes: 60,
    custom_duration: "",
  });

  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [slotDate, setSlotDate] = useState<Date>(new Date());
  const [errors, setErrors] = useState<string[]>([]);

  // Initialize from event or prefill
  useEffect(() => {
    if (open) {
      const defaultDuration = bookingSettings?.slot_duration_minutes || 60;
      
      if (event) {
        const startDate = parseISO(event.start_at);
        const eventDuration = differenceInMinutes(parseISO(event.end_at), parseISO(event.start_at));
        const isManual = event.source === 'manual';
        
        setFormData({
          title: event.title,
          client_id: event.client_id,
          location: event.location || "",
          start_at: format(startDate, "yyyy-MM-dd'T'HH:mm"),
          end_at: format(parseISO(event.end_at), "yyyy-MM-dd'T'HH:mm"),
          reminder_offset_minutes: event.reminder_offset_minutes || 0,
          booking_mode: isManual ? "custom" : "slot",
          duration_minutes: [30, 45, 60].includes(eventDuration) ? eventDuration : 0,
          custom_duration: [30, 45, 60].includes(eventDuration) ? "" : eventDuration.toString(),
        });
        
        setSlotDate(startDate);
        if (!isManual) {
          setSelectedSlot({
            start: event.start_at,
            end: event.end_at,
          });
        }
      } else if (prefillData) {
        setFormData({
          title: "",
          client_id: lockedClientId || prefillData.clientId || "",
          location: "",
          start_at: format(prefillData.start, "yyyy-MM-dd'T'HH:mm"),
          end_at: format(prefillData.end, "yyyy-MM-dd'T'HH:mm"),
          reminder_offset_minutes: 0,
          booking_mode: "slot",
          duration_minutes: defaultDuration,
          custom_duration: "",
        });
        setSlotDate(prefillData.start);
      } else {
        setFormData({
          title: "",
          client_id: lockedClientId || "",
          location: "",
          start_at: "",
          end_at: "",
          reminder_offset_minutes: 0,
          booking_mode: "slot",
          duration_minutes: defaultDuration,
          custom_duration: "",
        });
        setSlotDate(new Date());
      }
      
      setErrors([]);
      setSelectedSlot(null);
    }
  }, [event, prefillData, lockedClientId, open, bookingSettings]);

  const handleSlotSelect = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setFormData({
      ...formData,
      start_at: format(new Date(slot.start), "yyyy-MM-dd'T'HH:mm"),
      end_at: format(new Date(slot.end), "yyyy-MM-dd'T'HH:mm"),
    });
  };

  const handleStartChange = (value: string) => {
    if (!value) return;
    const startDate = new Date(value);
    const duration = formData.duration_minutes === 0 
      ? parseInt(formData.custom_duration || "60") 
      : formData.duration_minutes;
    const endDate = addMinutes(startDate, duration);
    setFormData({ 
      ...formData, 
      start_at: value,
      end_at: format(endDate, "yyyy-MM-dd'T'HH:mm")
    });
  };

  const handleEndChange = (value: string) => {
    if (!value) return;
    setFormData({ ...formData, end_at: value });
  };

  const handleDurationChange = (value: string) => {
    const minutes = value === "custom" ? 0 : parseInt(value);
    setFormData({ ...formData, duration_minutes: minutes });
    
    if (formData.booking_mode === "custom" && formData.start_at) {
      const duration = minutes === 0 
        ? parseInt(formData.custom_duration || "60") 
        : minutes;
      const startDate = new Date(formData.start_at);
      const endDate = addMinutes(startDate, duration);
      setFormData((prev) => ({ ...prev, end_at: format(endDate, "yyyy-MM-dd'T'HH:mm"), duration_minutes: minutes }));
    }
  };

  const handleCustomDurationChange = (value: string) => {
    const minutes = parseInt(value) || 0;
    setFormData({ ...formData, custom_duration: value });
    
    if (formData.booking_mode === "custom" && formData.start_at && minutes > 0) {
      const startDate = new Date(formData.start_at);
      const endDate = addMinutes(startDate, minutes);
      setFormData((prev) => ({ ...prev, end_at: format(endDate, "yyyy-MM-dd'T'HH:mm") }));
    }
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];

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
    
    if (duration <= 0) {
      newErrors.push("La durata deve essere maggiore di 0");
    }
    if (duration > 720) {
      newErrors.push("La durata massima è 12 ore (720 minuti)");
    }

    if (formData.start_at && formData.end_at) {
      const start = new Date(formData.start_at);
      const end = new Date(formData.end_at);
      
      if (end <= start) {
        newErrors.push("La data di fine deve essere dopo quella di inizio");
      }
    }

    // Slot mode: require slot selection
    if (formData.booking_mode === "slot" && !selectedSlot) {
      newErrors.push("Seleziona uno slot disponibile o passa alla modalità orario personalizzato");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const finalStartAt = new Date(formData.start_at);
    const finalEndAt = new Date(formData.end_at);

    const data = {
      title: formData.title,
      client_id: formData.client_id,
      location: formData.location || undefined,
      start_at: finalStartAt.toISOString(),
      end_at: finalEndAt.toISOString(),
      reminder_offset_minutes: formData.reminder_offset_minutes || undefined,
      aligned_to_slot: formData.booking_mode === "slot",
      source: formData.booking_mode === "custom" ? 'manual' as const : 'client' as const,
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

  const currentDuration = formData.duration_minutes === 0 
    ? parseInt(formData.custom_duration || "60") 
    : formData.duration_minutes;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {isEdit ? "Modifica appuntamento" : "Nuovo appuntamento"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 px-6 flex-1 overflow-y-auto pb-4">
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

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titolo *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="es. Allenamento individuale"
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

          <div className="space-y-4 pt-4 border-t">
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
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
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
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Come vuoi fissare l'orario?</Label>
              <RadioGroup
                value={formData.booking_mode}
                onValueChange={(value: "slot" | "custom") => {
                  setFormData({ ...formData, booking_mode: value });
                  if (value === "slot") {
                    setSelectedSlot(null);
                  }
                }}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="slot" id="mode-slot" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="mode-slot" className="cursor-pointer font-medium">
                      Usa slot disponibili (consigliato)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Scegli un orario tra quelli liberi generati automaticamente.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="custom" id="mode-custom" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="mode-custom" className="cursor-pointer font-medium">
                      Imposta orario personalizzato
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Crea un appuntamento fuori dagli slot standard (non visibile ai clienti).
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {formData.booking_mode === "slot" ? (
              <div className="space-y-4 pt-2">
                <SlotSelector
                  coachId={coachId}
                  selectedDate={slotDate}
                  onDateChange={setSlotDate}
                  selectedSlot={selectedSlot}
                  onSlotSelect={handleSlotSelect}
                  duration={currentDuration}
                />
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    ⚠️ Questo orario non rientra negli slot standard e non sarà visibile ai clienti.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="start">Inizio *</Label>
                  <DateTimePicker
                    value={formData.start_at}
                    onChange={handleStartChange}
                    placeholder="Seleziona data e ora"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end">Fine *</Label>
                  <DateTimePicker
                    value={formData.end_at}
                    onChange={handleEndChange}
                    placeholder="Seleziona data e ora"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
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
                  <SelectItem value="15">15 min prima</SelectItem>
                  <SelectItem value="30">30 min prima</SelectItem>
                  <SelectItem value="60">1 ora prima</SelectItem>
                  <SelectItem value="1440">1 giorno prima</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          {isEdit && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Elimina
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annulla
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {isEdit ? "Salva modifiche" : "Crea appuntamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
