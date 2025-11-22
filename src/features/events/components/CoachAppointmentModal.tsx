// FASE 4: Coach Appointment Modal - Libertà totale con warning soft
import { useState, useEffect, useMemo } from "react";
import { format, parse } from "date-fns";
import { it } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { useCreateEvent } from "../hooks/useCreateEvent";
import { useUpdateEvent } from "../hooks/useUpdateEvent";
import { useDeleteEvent } from "../hooks/useDeleteEvent";
import { useClientsQuery } from "@/features/clients/hooks/useClientsQuery";
import { useBookingSettingsQuery } from "@/features/bookings/hooks/useBookingSettings";
import { useAvailabilityWindowsQuery } from "@/features/bookings/hooks/useAvailability";
import { useEventsQuery } from "../hooks/useEventsQuery";
import { getAppointmentWarningsForCoach } from "../utils/appointment-warnings";
import type { EventWithClient } from "../types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CoachAppointmentModalProps {
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

export function CoachAppointmentModal({
  open,
  onOpenChange,
  event,
  prefillData,
  lockedClientId,
  onStartSession,
}: CoachAppointmentModalProps) {
  const isEditMode = !!event;
  
  const [clientId, setClientId] = useState(event?.client_id || lockedClientId || prefillData?.clientId || "");
  const [title, setTitle] = useState(event?.title || "");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState(event?.location || "");
  const [notes, setNotes] = useState(event?.notes || "");

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  
  const { data: clientsData } = useClientsQuery({
    q: "", 
    page: 1, 
    limit: 100 
  });
  const clientsArray = clientsData?.items || [];
  const { data: bookingSettings } = useBookingSettingsQuery();
  const { data: availabilityWindows = [] } = useAvailabilityWindowsQuery();
  const { data: existingEvents = [] } = useEventsQuery({});

  // Initialize form fields
  useEffect(() => {
    if (event) {
      const start = new Date(event.start_at);
      const end = new Date(event.end_at);
      
      setDate(format(start, "yyyy-MM-dd"));
      setStartTime(format(start, "HH:mm"));
      setEndTime(format(end, "HH:mm"));
    } else if (prefillData) {
      setDate(format(prefillData.start, "yyyy-MM-dd"));
      setStartTime(format(prefillData.start, "HH:mm"));
      setEndTime(format(prefillData.end, "HH:mm"));
    }
  }, [event, prefillData, open]);

  // Calculate warnings
  const warnings = useMemo(() => {
    if (!date || !startTime || !endTime) return [];
    
    try {
      const start = parse(`${date} ${startTime}`, "yyyy-MM-dd HH:mm", new Date());
      const end = parse(`${date} ${endTime}`, "yyyy-MM-dd HH:mm", new Date());
      
      return getAppointmentWarningsForCoach({
        start,
        end,
        availabilityWindows,
        minHoursBeforeBooking: bookingSettings?.min_advance_notice_hours || 24,
        standardDurations: [30, 45, 60],
        existingEvents: existingEvents.map(e => ({
          start_at: e.start_at,
          end_at: e.end_at,
        })),
      });
    } catch {
      return [];
    }
  }, [date, startTime, endTime, availabilityWindows, bookingSettings, existingEvents]);

  const handleSave = async () => {
    if (!clientId || !date || !startTime || !endTime) return;

    const start = parse(`${date} ${startTime}`, "yyyy-MM-dd HH:mm", new Date());
    const end = parse(`${date} ${endTime}`, "yyyy-MM-dd HH:mm", new Date());

    const payload = {
      client_id: clientId,
      title: title || "Sessione di allenamento",
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      location,
      notes,
      source: 'manual' as const,
    };

    if (isEditMode) {
      await updateEvent.mutateAsync({ id: event.id, data: payload });
    } else {
      await createEvent.mutateAsync(payload);
    }

    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!event) return;
    if (confirm("Sei sicuro di voler eliminare questo appuntamento?")) {
      await deleteEvent.mutateAsync(event.id);
      onOpenChange(false);
    }
  };

  const duration = useMemo(() => {
    if (!startTime || !endTime) return null;
    try {
      const start = parse(startTime, "HH:mm", new Date());
      const end = parse(endTime, "HH:mm", new Date());
      const diff = (end.getTime() - start.getTime()) / 60000;
      return diff > 0 ? diff : null;
    } catch {
      return null;
    }
  }, [startTime, endTime]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Modifica appuntamento" : "Nuovo appuntamento"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warnings Section */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              {warnings.map((warning, i) => (
                <Alert key={i} variant={warning.severity === 'warning' ? 'default' : 'default'}>
                  {warning.severity === 'warning' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Info className="h-4 w-4" />
                  )}
                  <AlertDescription className="text-sm">
                    {warning.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Cliente *</Label>
            <Select 
              value={clientId} 
              onValueChange={setClientId}
              disabled={!!lockedClientId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientsArray.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titolo</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sessione di allenamento"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Data *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Ora inizio *</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">Ora fine *</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Duration Display */}
          {duration && (
            <div className="text-sm text-muted-foreground">
              Durata: {duration} minuti
            </div>
          )}

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Luogo</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Es: Palestra, Online, etc."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Aggiungi note o dettagli..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <div>
              {isEditMode && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteEvent.isPending}
                >
                  Elimina
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annulla
              </Button>
              <Button
                onClick={handleSave}
                disabled={!clientId || !date || !startTime || !endTime || createEvent.isPending || updateEvent.isPending}
              >
                {isEditMode ? "Salva" : "Crea"}
              </Button>
            </div>
          </div>

          {/* Start Session - Only in edit mode */}
          {isEditMode && event && onStartSession && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onStartSession(event.client_id, event.id, event.linked_plan_id, event.linked_day_id)}
            >
              Inizia sessione
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
