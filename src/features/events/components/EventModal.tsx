import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { format, parseISO, addHours } from "date-fns";
import { it } from "date-fns/locale";
import { useClientsQuery } from "@/features/clients/hooks/useClientsQuery";
import { useCreateEvent } from "../hooks/useCreateEvent";
import { useUpdateEvent } from "../hooks/useUpdateEvent";
import { useDeleteEvent } from "../hooks/useDeleteEvent";
import { AlertCircle, Trash2 } from "lucide-react";
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
}

export function EventModal({ open, onOpenChange, event, prefillData, lockedClientId }: EventModalProps) {
  const isEdit = !!event;
  const { data: clientsData } = useClientsQuery({ limit: 1000 });
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  const [formData, setFormData] = useState({
    title: "",
    client_id: "",
    location: "",
    start_at: "",
    end_at: "",
    notes: "",
    is_all_day: false,
    reminder_offset_minutes: 0,
  });

  const [savedTimeValues, setSavedTimeValues] = useState({ start: "", end: "" });
  const [errors, setErrors] = useState<string[]>([]);

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
      });
      setSavedTimeValues({ start: "", end: "" });
    }
    setErrors([]);
  }, [event, prefillData, lockedClientId, open]);

  const roundToNearest5Minutes = (dateStr: string): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const minutes = date.getMinutes();
    const roundedMinutes = Math.round(minutes / 5) * 5;
    date.setMinutes(roundedMinutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  const handleStartChange = (value: string) => {
    const rounded = roundToNearest5Minutes(value);
    setSavedTimeValues((prev) => ({ ...prev, start: rounded }));
    
    if (!formData.is_all_day) {
      setFormData({ ...formData, start_at: rounded });
      
      // Auto-set end time to +1 hour if not editing
      if (!isEdit && rounded) {
        const endDate = addHours(new Date(rounded), 1);
        const endRounded = roundToNearest5Minutes(format(endDate, "yyyy-MM-dd'T'HH:mm"));
        setSavedTimeValues((prev) => ({ ...prev, end: endRounded }));
        setFormData((prev) => ({ ...prev, start_at: rounded, end_at: endRounded }));
      }
    } else {
      // All-day mode: just update the date part
      const dateOnly = rounded.split('T')[0];
      setFormData({ ...formData, start_at: dateOnly, end_at: dateOnly });
    }
  };

  const handleEndChange = (value: string) => {
    const rounded = roundToNearest5Minutes(value);
    setSavedTimeValues((prev) => ({ ...prev, end: rounded }));
    if (!formData.is_all_day) {
      setFormData({ ...formData, end_at: rounded });
    }
  };

  const handleAllDayToggle = (checked: boolean) => {
    if (checked) {
      // Switch to all-day: keep date only
      const dateOnly = formData.start_at ? formData.start_at.split('T')[0] : "";
      setFormData({ ...formData, is_all_day: true, start_at: dateOnly, end_at: dateOnly });
    } else {
      // Switch back to timed: restore saved times or use defaults
      const start = savedTimeValues.start || format(new Date(), "yyyy-MM-dd'T'HH:mm");
      const end = savedTimeValues.end || format(addHours(new Date(start), 1), "yyyy-MM-dd'T'HH:mm");
      setFormData({ ...formData, is_all_day: false, start_at: start, end_at: end });
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

    if (formData.start_at && formData.end_at) {
      const start = new Date(formData.start_at);
      const end = new Date(formData.end_at);
      if (end <= start) {
        newErrors.push("La data di fine deve essere dopo quella di inizio");
      }
      if (start < new Date()) {
        newErrors.push("⚠️ Attenzione: stai creando un appuntamento nel passato");
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0 || newErrors.some(e => e.includes("⚠️"));
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const data = {
      title: formData.title,
      client_id: formData.client_id,
      location: formData.location || undefined,
      start_at: new Date(formData.start_at).toISOString(),
      end_at: new Date(formData.end_at).toISOString(),
      notes: formData.notes || undefined,
      is_all_day: formData.is_all_day,
      reminder_offset_minutes: formData.reminder_offset_minutes || undefined,
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifica appuntamento" : "Nuovo appuntamento"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-y-auto">
          {errors.length > 0 && (
            <Alert variant={errors.some(e => !e.includes("⚠️")) ? "destructive" : "default"}>
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
                <Input
                  id="start"
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) => handleStartChange(e.target.value)}
                  step={300}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end">Fine *</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) => handleEndChange(e.target.value)}
                  step={300}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Data Inizio *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formData.start_at}
                  onChange={(e) => setFormData({ ...formData, start_at: e.target.value, end_at: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">Data Fine *</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={formData.end_at}
                  onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
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

        <div className="flex justify-between gap-3 pt-4 border-t sticky bottom-0 bg-background">
          {isEdit && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Elimina
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {isEdit ? "Salva" : "Crea"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
