import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBookingSettingsQuery, useUpdateBookingSettings } from "../hooks/useBookingSettings";
import { AvailabilityEditor } from "./AvailabilityEditor";
import { OutOfOfficeManager } from "./OutOfOfficeManager";
import { Button } from "@/components/ui/button";
import { Clock, Calendar as CalendarIcon, Settings2 } from "lucide-react";
import type { UpdateBookingSettingsInput } from "../types";

export function BookingSettingsTab() {
  const { data: settings, isLoading } = useBookingSettingsQuery();
  const updateMutation = useUpdateBookingSettings();

  const [formData, setFormData] = useState<UpdateBookingSettingsInput>({
    enabled: false,
    min_advance_notice_hours: 24,
    slot_duration_minutes: 60,
    approval_mode: "MANUAL",
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        enabled: settings.enabled,
        min_advance_notice_hours: settings.min_advance_notice_hours,
        slot_duration_minutes: settings.slot_duration_minutes,
        approval_mode: settings.approval_mode,
      });
    }
  }, [settings]);

  const handleFieldChange = (field: keyof UpdateBookingSettingsInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await updateMutation.mutateAsync(formData);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Caricamento impostazioni...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Impostazioni generali
          </CardTitle>
          <CardDescription>
            Configura come i clienti possono prenotare appuntamenti con te
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled" className="text-base">
                Abilita prenotazioni self-service
              </Label>
              <p className="text-sm text-muted-foreground">
                Permetti ai clienti di prenotare appuntamenti autonomamente
              </p>
            </div>
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => handleFieldChange("enabled", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notice" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Preavviso minimo
            </Label>
            <Select
              value={formData.min_advance_notice_hours?.toString()}
              onValueChange={(value) =>
                handleFieldChange("min_advance_notice_hours", parseInt(value))
              }
            >
              <SelectTrigger id="notice">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 ore</SelectItem>
                <SelectItem value="24">24 ore</SelectItem>
                <SelectItem value="48">48 ore</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Tempo minimo richiesto prima dell'appuntamento
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Durata slot
            </Label>
            <Select
              value={formData.slot_duration_minutes?.toString()}
              onValueChange={(value) =>
                handleFieldChange("slot_duration_minutes", parseInt(value))
              }
            >
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minuti</SelectItem>
                <SelectItem value="45">45 minuti</SelectItem>
                <SelectItem value="60">60 minuti</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Durata standard degli slot di prenotazione
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="approval">Modalità approvazione</Label>
            <Select
              value={formData.approval_mode}
              onValueChange={(value: "AUTO" | "MANUAL") =>
                handleFieldChange("approval_mode", value)
              }
            >
              <SelectTrigger id="approval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL">Manuale - richiede approvazione</SelectItem>
                <SelectItem value="AUTO">Automatica - conferma immediata</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {formData.approval_mode === "MANUAL"
                ? "Dovrai approvare manualmente ogni richiesta di prenotazione"
                : "Le prenotazioni verranno confermate automaticamente"}
            </p>
          </div>

          {hasChanges && (
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="w-full"
            >
              {updateMutation.isPending ? "Salvataggio..." : "Salva impostazioni"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="availability" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="availability">Disponibilità settimanale</TabsTrigger>
          <TabsTrigger value="out-of-office">Fuori ufficio</TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Disponibilità settimanale</CardTitle>
              <CardDescription>
                Imposta le fasce orarie in cui sei disponibile per le prenotazioni
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvailabilityEditor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="out-of-office" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Periodi fuori ufficio</CardTitle>
              <CardDescription>
                Blocca periodi specifici in cui non sarai disponibile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OutOfOfficeManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
