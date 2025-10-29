import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { format, addHours } from "date-fns";
import { useClientsQuery } from "@/features/clients/hooks/useClientsQuery";
import { useCreateEvent } from "../hooks/useCreateEvent";
import { Dumbbell, HeartPulse, MessageSquare, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppointmentWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillData?: {
    start: Date;
    end: Date;
    clientId?: string;
  };
}

type AppointmentType = "training" | "recovery" | "meeting" | "other";

export function AppointmentWizard({ open, onOpenChange, prefillData }: AppointmentWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<AppointmentType>("training");
  const [formData, setFormData] = useState({
    client_id: prefillData?.clientId || "",
    start_at: prefillData ? format(prefillData.start, "yyyy-MM-dd'T'HH:mm") : "",
    end_at: prefillData ? format(prefillData.end, "yyyy-MM-dd'T'HH:mm") : "",
    location: "",
    notes: "",
  });

  const { data: clientsData } = useClientsQuery({ limit: 1000 });
  const createMutation = useCreateEvent();

  const typeConfig: Record<AppointmentType, { icon: any; label: string; title: string; color: string }> = {
    training: { icon: Dumbbell, label: "Allenamento", title: "Sessione di allenamento", color: "text-blue-600" },
    recovery: { icon: HeartPulse, label: "Recupero", title: "Sessione di recupero", color: "text-green-600" },
    meeting: { icon: MessageSquare, label: "Consulenza", title: "Consulenza", color: "text-purple-600" },
    other: { icon: Calendar, label: "Altro", title: "Appuntamento", color: "text-gray-600" },
  };

  const handleReset = () => {
    setStep(1);
    setSelectedType("training");
    setFormData({
      client_id: prefillData?.clientId || "",
      start_at: prefillData ? format(prefillData.start, "yyyy-MM-dd'T'HH:mm") : "",
      end_at: prefillData ? format(prefillData.end, "yyyy-MM-dd'T'HH:mm") : "",
      location: "",
      notes: "",
    });
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleStartChange = (value: string) => {
    const start = new Date(value);
    const end = addHours(start, 1);
    setFormData({
      ...formData,
      start_at: value,
      end_at: format(end, "yyyy-MM-dd'T'HH:mm"),
    });
  };

  const handleConfirm = async () => {
    const data = {
      title: typeConfig[selectedType].title,
      client_id: formData.client_id,
      location: formData.location || undefined,
      start_at: new Date(formData.start_at).toISOString(),
      end_at: new Date(formData.end_at).toISOString(),
      notes: formData.notes || undefined,
      is_all_day: false,
    };

    await createMutation.mutateAsync(data);
    handleClose();
  };

  const canProceed = () => {
    if (step === 1) return true;
    if (step === 2) return formData.start_at && formData.end_at;
    if (step === 3) return formData.client_id;
    return true;
  };

  const getSelectedClient = () => {
    return clientsData?.items.find((c) => c.id === formData.client_id);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Nuovo appuntamento</DialogTitle>
          <div className="flex gap-1 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  s <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="py-6 min-h-[280px]">
          {step === 1 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg mb-4">Che tipo di appuntamento vuoi creare?</h3>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(typeConfig) as AppointmentType[]).map((type) => {
                  const config = typeConfig[type];
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        "flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all hover:shadow-md",
                        selectedType === type
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Icon className={cn("h-8 w-8", config.color)} />
                      <span className="font-medium">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg mb-4">Quando?</h3>
              <div className="space-y-2">
                <Label htmlFor="start">Inizio</Label>
                <DateTimePicker
                  value={formData.start_at}
                  onChange={handleStartChange}
                  placeholder="Seleziona data e ora"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Fine</Label>
                <DateTimePicker
                  value={formData.end_at}
                  onChange={(value) => setFormData({ ...formData, end_at: value })}
                  placeholder="Seleziona data e ora"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg mb-4">Con chi?</h3>
              <div className="space-y-2">
                <Label htmlFor="client">Cliente</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                >
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Seleziona cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsData?.items
                      .filter((c) => c.status !== "ARCHIVIATO")
                      .map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.first_name} {client.last_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Luogo (opzionale)</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="es. Palestra, Via Roma 10"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h3 className="font-semibold text-lg mb-4">Conferma appuntamento</h3>
              <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  {(() => {
                    const Icon = typeConfig[selectedType].icon;
                    return <Icon className={cn("h-5 w-5 mt-0.5", typeConfig[selectedType].color)} />;
                  })()}
                  <div className="flex-1">
                    <p className="font-semibold">{typeConfig[selectedType].title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      con {getSelectedClient()?.first_name} {getSelectedClient()?.last_name}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Quando</p>
                    <p className="font-medium">
                      {formData.start_at && format(new Date(formData.start_at), "d MMM yyyy")}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formData.start_at && format(new Date(formData.start_at), "HH:mm")} -{" "}
                      {formData.end_at && format(new Date(formData.end_at), "HH:mm")}
                    </p>
                  </div>
                  {formData.location && (
                    <div>
                      <p className="text-muted-foreground">Dove</p>
                      <p className="font-medium">{formData.location}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Note aggiuntive (opzionale)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Aggiungi note..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Indietro
            </Button>
          ) : (
            <div />
          )}
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Avanti
            </Button>
          ) : (
            <Button onClick={handleConfirm} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creazione..." : "Conferma appuntamento"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
