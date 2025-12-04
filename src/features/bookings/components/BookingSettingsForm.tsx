import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useBookingSettingsQuery } from "../hooks/useBookingSettingsQuery";
import { useUpdateBookingSettings } from "../hooks/useUpdateBookingSettings";
import { useUpdateAvailabilityWindows } from "../hooks/useUpdateAvailabilityWindows";
import { useAvailabilityWindowsQuery } from "../hooks/useAvailabilityWindowsQuery";
import { AvailabilityEditor } from "./AvailabilityEditor";
import { OutOfOfficeManager } from "./OutOfOfficeManager";
import { GlobalSaveBar } from "./GlobalSaveBar";
import { Loader2, CheckCircle2, Clock, Info, Calendar, CalendarX } from "lucide-react";
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

  // Helper to validate time range
  const isValidTimeRange = (start: string, end: string): boolean => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return endMinutes > startMinutes;
  };

  const onSubmit = (values: BookingSettingsFormValues) => {
    // Validate availability changes before saving
    const availabilityChanges = availabilityChangesRef.current;
    if (Object.keys(availabilityChanges).length > 0) {
      // Check for invalid time ranges
      const invalidRanges: Array<{ day: number; range: TimeRange }> = [];
      Object.entries(availabilityChanges).forEach(([dayKey, ranges]) => {
        const dayOfWeek = parseInt(dayKey);
        ranges.forEach((r) => {
          if (!isValidTimeRange(r.start_time, r.end_time)) {
            invalidRanges.push({ day: dayOfWeek, range: r });
          }
        });
      });

      if (invalidRanges.length > 0) {
        toast.error("Impossibile salvare", {
          description: "Alcune fasce orarie attraversano mezzanotte. Correggi questi orari prima di salvare.",
        });
        return; // Block save
      }
    }

    // Save form settings
    updateSettings(values, {
      onSuccess: () => {
        // Save availability changes if any
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
              toast.success("Impostazioni salvate");
            },
          });
        } else {
          form.reset(values);
          setHasUnsavedChanges(false);
          toast.success("Impostazioni salvate");
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
      <Card>
        <CardHeader>
          <CardTitle>Prenotazioni</CardTitle>
          <CardDescription>
            Gestisci le prenotazioni self-service dei tuoi clienti
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Prominent Toggle Section */}
              <div className="bg-muted/30 border rounded-lg p-4">
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          <FormLabel className="text-base font-semibold cursor-pointer">
                            Prenotazioni self-service
                          </FormLabel>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Consenti ai tuoi clienti di prenotare autonomamente gli appuntamenti nelle fasce orarie che definisci
                        </p>
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
              </div>

              {/* Disabled State - Informative Card */}
              {!form.watch("enabled") && (
                <Card className="border-dashed bg-muted/20">
                  <CardContent className="py-8 text-center">
                    <div className="space-y-3">
                      <CalendarX className="h-10 w-10 mx-auto text-muted-foreground" />
                      <h4 className="text-lg font-semibold">Prenotazioni disabilitate</h4>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Le prenotazioni self-service sono disabilitate. I tuoi clienti non potranno prenotare autonomamente. Attiva la funzionalità per configurare disponibilità e regole.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Conditional Configuration Sections */}
              {form.watch("enabled") && (
                <>
                  {/* Booking Rules Section */}
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h4 className="text-lg font-semibold">Regole di prenotazione</h4>
                      <p className="text-sm text-muted-foreground">
                        Questi parametri determinano come i clienti possono prenotare
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Min advance notice */}
                      <FormField
                        control={form.control}
                        name="min_advance_notice_hours"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
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
                              onValueChange={(value) => {
                                field.onChange(parseInt(value));
                                setHasUnsavedChanges(true);
                              }}
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
                          <FormItem className="space-y-3">
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
                              onValueChange={(value) => {
                                field.onChange(parseInt(value));
                                setHasUnsavedChanges(true);
                              }}
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
                          <FormItem className="space-y-3">
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
                              onValueChange={(value) => {
                                field.onChange(parseInt(value));
                                setHasUnsavedChanges(true);
                              }}
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
                          <FormItem className="space-y-3">
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
                              onValueChange={(value) => {
                                field.onChange(parseInt(value));
                                setHasUnsavedChanges(true);
                              }}
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
                        <FormItem className="space-y-3">
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
                          <Select 
                            value={field.value} 
                            onValueChange={(value) => {
                              field.onChange(value);
                              setHasUnsavedChanges(true);
                            }}
                          >
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
                  </div>

                  {/* Weekly Time Slots Section */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-lg font-semibold">Fasce orarie settimanali</h4>
                      <p className="text-sm text-muted-foreground">
                        Definisci quando i clienti possono prenotare
                      </p>
                    </div>
                    <AvailabilityEditor 
                      key={resetAvailability}
                      onChangeDetected={() => setHasUnsavedChanges(true)}
                      localChangesRef={availabilityChangesRef}
                    />
                  </div>

                  {/* Absence Periods Section */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-lg font-semibold">Periodi di assenza</h4>
                      <p className="text-sm text-muted-foreground">
                        Blocca date specifiche in cui non sei disponibile per i clienti
                      </p>
                    </div>
                    <OutOfOfficeManager onChangeDetected={() => setHasUnsavedChanges(true)} />
                  </div>
                </>
              )}
            </form>
          </Form>

          {/* Global Save Bar */}
          <GlobalSaveBar
            show={hasUnsavedChanges}
            onSave={form.handleSubmit(onSubmit)}
            onCancel={handleCancelChanges}
            isSaving={isPending || isUpdatingAvailability}
            error={error?.message}
          />
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
