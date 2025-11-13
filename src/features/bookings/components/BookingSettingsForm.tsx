import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useBookingSettingsQuery } from "../hooks/useBookingSettingsQuery";
import { useUpdateBookingSettings } from "../hooks/useUpdateBookingSettings";
import { useUpdateAvailabilityWindows } from "../hooks/useUpdateAvailabilityWindows";
import { useAvailabilityWindowsQuery } from "../hooks/useAvailabilityWindowsQuery";
import { AvailabilityEditor } from "./AvailabilityEditor";
import { OutOfOfficeManager } from "./OutOfOfficeManager";
import { GlobalSaveBar } from "./GlobalSaveBar";
import { Loader2, CheckCircle2, Clock, Info } from "lucide-react";
import type { CreateAvailabilityWindowInput } from "../types";

interface BookingSettingsFormValues {
  enabled: boolean;
  min_advance_notice_hours: number;
  slot_duration_minutes: number;
  buffer_between_minutes: number;
  cancel_policy_hours: number;
  approval_mode: "AUTO" | "MANUAL";
}

interface TimeRange {
  start_time: string;
  end_time: string;
  temp_id?: string;
}

export function BookingSettingsForm() {
  const { data: settings, isLoading } = useBookingSettingsQuery();
  const { data: windows = [] } = useAvailabilityWindowsQuery();
  const { mutate: updateSettings, isPending, error } = useUpdateBookingSettings();
  const { mutate: updateAvailability, isPending: isUpdatingAvailability } = useUpdateAvailabilityWindows();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [resetAvailability, setResetAvailability] = useState(0);
  const availabilityChangesRef = useRef<Record<number, TimeRange[]>>({});

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

  // Track form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(form.formState.isDirty);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = (values: BookingSettingsFormValues) => {
    // Save form settings
    updateSettings(values, {
      onSuccess: () => {
        // Save availability changes if any
        const availabilityChanges = availabilityChangesRef.current;
        if (Object.keys(availabilityChanges).length > 0) {
          const allWindows: CreateAvailabilityWindowInput[] = [];
          
          // Process each day with changes
          Object.entries(availabilityChanges).forEach(([dayKey, ranges]) => {
            const dayOfWeek = parseInt(dayKey);
            ranges.forEach((r) => {
              allWindows.push({
                day_of_week: dayOfWeek,
                start_time: r.start_time,
                end_time: r.end_time,
              });
            });
          });

          // Also include unchanged days from original windows
          for (let day = 0; day < 7; day++) {
            if (!availabilityChanges[day]) {
              const dayWindows = windows.filter(w => w.day_of_week === day);
              dayWindows.forEach(w => {
                allWindows.push({
                  day_of_week: w.day_of_week,
                  start_time: w.start_time,
                  end_time: w.end_time,
                });
              });
            }
          }

          updateAvailability(allWindows, {
            onSuccess: () => {
              form.reset(values);
              availabilityChangesRef.current = {};
              setHasUnsavedChanges(false);
            },
          });
        } else {
          form.reset(values);
          setHasUnsavedChanges(false);
        }
      },
    });
  };

  const handleCancelChanges = () => {
    // Reset form to last saved values
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
    
    // Reset availability changes
    availabilityChangesRef.current = {};
    setResetAvailability(prev => prev + 1);
    
    setHasUnsavedChanges(false);
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
    <TooltipProvider delayDuration={200}>
      <div className="space-y-8 pb-24">
        {/* General Settings */}
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold">Impostazioni generali</h3>
            <p className="text-sm text-muted-foreground">
              Configura le tue preferenze di prenotazione
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Self-service bookings toggle */}
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                      <div className="flex items-center gap-2">
                        <FormLabel className="text-sm font-medium cursor-pointer">
                          Prenotazioni self-service
                        </FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex">
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>
                              Consenti ai clienti di prenotare autonomamente gli slot disponibili
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Two-column grid for remaining fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Min advance notice */}
                  <FormField
                    control={form.control}
                    name="min_advance_notice_hours"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FormLabel className="text-sm font-medium">Preavviso minimo</FormLabel>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="inline-flex">
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>
                                Tempo minimo richiesto tra la richiesta e l'orario della sessione
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
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
                      </FormItem>
                    )}
                  />

                  {/* Slot duration */}
                  <FormField
                    control={form.control}
                    name="slot_duration_minutes"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FormLabel className="text-sm font-medium">Durata slot</FormLabel>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="inline-flex">
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>
                                Durata predefinita per ogni slot di prenotazione
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
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
                      </FormItem>
                    )}
                  />

                  {/* Buffer between slots */}
                  <FormField
                    control={form.control}
                    name="buffer_between_minutes"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FormLabel className="text-sm font-medium">Buffer tra slot</FormLabel>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="inline-flex">
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>
                                Pausa invisibile tra slot consecutivi (non prenotabile dai clienti)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
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
                      </FormItem>
                    )}
                  />

                  {/* Cancel policy */}
                  <FormField
                    control={form.control}
                    name="cancel_policy_hours"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FormLabel className="text-sm font-medium">Finestra cancellazione tardiva</FormLabel>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="inline-flex">
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>
                                Le cancellazioni entro questo periodo consumano una sessione
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
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
                      </FormItem>
                    )}
                  />
                </div>

                {/* Approval mode - full width */}
                <FormField
                  control={form.control}
                  name="approval_mode"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FormLabel className="text-sm font-medium">Modalità approvazione</FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex">
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>
                              {field.value === "AUTO" 
                                ? "Le richieste vengono approvate automaticamente"
                                : "Dovrai approvare manualmente ogni richiesta"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
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
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </div>

        {/* Weekly Time Slots */}
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold">Fasce orarie settimanali</h3>
            <p className="text-sm text-muted-foreground">
              Definisci quando sei disponibile per le prenotazioni
            </p>
          </div>
          <AvailabilityEditor 
            key={resetAvailability}
            onChangeDetected={() => setHasUnsavedChanges(true)}
            localChangesRef={availabilityChangesRef}
          />
        </div>

        {/* Absence Periods */}
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold">Periodi di assenza</h3>
            <p className="text-sm text-muted-foreground">
              Blocca date specifiche per vacanze o altri impegni
            </p>
          </div>
          <OutOfOfficeManager />
        </div>

        {/* Global Save Bar */}
        <GlobalSaveBar
          show={hasUnsavedChanges}
          onSave={form.handleSubmit(onSubmit)}
          onCancel={handleCancelChanges}
          isSaving={isPending || isUpdatingAvailability}
          error={error?.message}
        />
      </div>
    </TooltipProvider>
  );
}
