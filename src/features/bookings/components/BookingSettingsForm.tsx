import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useBookingSettingsQuery } from "../hooks/useBookingSettingsQuery";
import { useUpdateBookingSettings } from "../hooks/useUpdateBookingSettings";
import { Loader2 } from "lucide-react";

interface BookingSettingsFormValues {
  min_advance_notice_hours: number;
  cancel_policy_hours: number;
  approval_mode: "AUTO" | "MANUAL";
}

export function BookingSettingsForm() {
  const { data: settings, isLoading } = useBookingSettingsQuery();
  const { mutate: updateSettings, isPending } = useUpdateBookingSettings();

  const form = useForm<BookingSettingsFormValues>({
    defaultValues: {
      min_advance_notice_hours: 24,
      cancel_policy_hours: 24,
      approval_mode: "MANUAL",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        min_advance_notice_hours: settings.min_advance_notice_hours,
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
    <Card>
      <CardHeader>
        <CardTitle>Impostazioni Prenotazioni</CardTitle>
        <CardDescription>
          Gestisci le regole di prenotazione, conferma e cancellazione
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="min_advance_notice_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preavviso minimo richiesta</FormLabel>
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
                  <FormLabel>Modalità approvazione</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MANUAL">Manuale</SelectItem>
                      <SelectItem value="AUTO">Automatica</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Scegli se approvare automaticamente le richieste di prenotazione
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                Le modifiche si applicano a tutte le nuove richieste di prenotazione.
                Le impostazioni precedenti non saranno modificate retroattivamente.
              </p>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvataggio..." : "Salva Impostazioni"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
