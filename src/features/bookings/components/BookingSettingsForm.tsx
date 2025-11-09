import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useBookingSettingsQuery } from "../hooks/useBookingSettingsQuery";
import { useUpdateBookingSettings } from "../hooks/useUpdateBookingSettings";
import { AvailabilityEditor } from "./AvailabilityEditor";
import { OutOfOfficeManager } from "./OutOfOfficeManager";
import { Loader2, CheckCircle2, Clock } from "lucide-react";

interface BookingSettingsFormValues {
  enabled: boolean;
  min_advance_notice_hours: number;
  slot_duration_minutes: number;
  buffer_between_minutes: number;
  cancel_policy_hours: number;
  approval_mode: "AUTO" | "MANUAL";
}

export function BookingSettingsForm() {
  const { data: settings, isLoading } = useBookingSettingsQuery();
  const { mutate: updateSettings, isPending } = useUpdateBookingSettings();

  const form = useForm<BookingSettingsFormValues>({
    defaultValues: {
      enabled: false,
      min_advance_notice_hours: 24,
      slot_duration_minutes: 60,
      buffer_between_minutes: 0,
      cancel_policy_hours: 24,
      approval_mode: "MANUAL",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        enabled: settings.enabled ?? false,
        min_advance_notice_hours: settings.min_advance_notice_hours,
        slot_duration_minutes: settings.slot_duration_minutes ?? 60,
        buffer_between_minutes: settings.buffer_between_minutes ?? 0,
        cancel_policy_hours: settings.cancel_policy_hours || 24,
        approval_mode: settings.approval_mode,
      });
    }
  }, [settings, form]);

  const onSubmit = (values: BookingSettingsFormValues) => {
    updateSettings(values);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Impostazioni generali</CardTitle>
          <CardDescription>
            Configura come i clienti possono prenotare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Prenotazioni self-service</FormLabel>
                      <FormDescription>
                        Consenti ai clienti di prenotare autonomamente gli slot disponibili
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_advance_notice_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preavviso minimo</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="12">12 ore</SelectItem>
                        <SelectItem value="24">24 ore</SelectItem>
                        <SelectItem value="48">48 ore</SelectItem>
                        <SelectItem value="72">72 ore</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Tempo minimo richiesto tra la richiesta e l'orario della sessione
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slot_duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durata slot</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="30">30 minuti</SelectItem>
                        <SelectItem value="45">45 minuti</SelectItem>
                        <SelectItem value="60">60 minuti</SelectItem>
                        <SelectItem value="90">90 minuti</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Durata predefinita di ogni slot di prenotazione
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buffer_between_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buffer tra slot</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Nessuno</SelectItem>
                        <SelectItem value="5">5 minuti</SelectItem>
                        <SelectItem value="10">10 minuti</SelectItem>
                        <SelectItem value="15">15 minuti</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Tempo di pausa invisibile tra slot consecutivi (non prenotabile dai clienti)
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cancel_policy_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Finestra "Late cancel"</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="12">12 ore</SelectItem>
                        <SelectItem value="24">24 ore</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Le cancellazioni entro questo periodo consumano una sessione
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="approval_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalità di approvazione</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AUTO">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Automatica</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="MANUAL">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span>Manuale</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value === "AUTO" 
                        ? "Le richieste vengono approvate automaticamente"
                        : "Dovrai approvare manualmente ogni richiesta"}
                    </FormDescription>
                  </FormItem>
                )}
              />

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  Le modifiche si applicano a tutte le nuove richieste di prenotazione.
                  Le impostazioni precedenti non saranno modificate retroattivamente.
                </p>
                <Button type="submit" disabled={isPending} className="w-full md:w-auto">
                  {isPending ? "Salvataggio..." : "Salva Impostazioni"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fasce orarie settimanali</CardTitle>
          <CardDescription>
            Definisci quando sei disponibile per le prenotazioni
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvailabilityEditor />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Periodi di assenza</CardTitle>
          <CardDescription>
            Blocca date specifiche per ferie o altri impegni
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OutOfOfficeManager />
        </CardContent>
      </Card>
    </div>
  );
}
