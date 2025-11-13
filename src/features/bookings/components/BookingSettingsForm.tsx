import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useBookingSettingsQuery } from "../hooks/useBookingSettingsQuery";
import { useUpdateBookingSettings } from "../hooks/useUpdateBookingSettings";
import { AvailabilityEditor } from "./AvailabilityEditor";
import { OutOfOfficeManager } from "./OutOfOfficeManager";
import { GlobalSaveBar } from "./GlobalSaveBar";
import { Loader2, CheckCircle2, Clock, Info } from "lucide-react";

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
  const { mutate: updateSettings, isPending, error } = useUpdateBookingSettings();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
    updateSettings(values, {
      onSuccess: () => {
        form.reset(values);
        setHasUnsavedChanges(false);
      },
    });
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
                          Self-service bookings
                        </FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex">
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>
                              Allow clients to book available time slots independently
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
                          <FormLabel className="text-sm font-medium">Min advance notice</FormLabel>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="inline-flex">
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>
                                Minimum time required between request and session time
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
                          <FormLabel className="text-sm font-medium">Slot duration</FormLabel>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="inline-flex">
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>
                                Default duration for each booking slot
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
                          <FormLabel className="text-sm font-medium">Buffer between slots</FormLabel>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="inline-flex">
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>
                                Invisible break time between consecutive slots (not bookable by clients)
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
                          <FormLabel className="text-sm font-medium">Late cancel window</FormLabel>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="inline-flex">
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>
                                Cancellations within this period consume a session
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
                        <FormLabel className="text-sm font-medium">Approval mode</FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex">
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>
                              {field.value === "AUTO" 
                                ? "Requests are approved automatically"
                                : "You will need to approve each request manually"}
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
                              <span>Automatic</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="MANUAL">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-orange-600" />
                              <span>Manual</span>
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
            <h3 className="text-lg font-semibold">Weekly Time Slots</h3>
            <p className="text-sm text-muted-foreground">
              Define when you're available for bookings
            </p>
          </div>
          <AvailabilityEditor 
            onChangeDetected={() => setHasUnsavedChanges(true)}
          />
        </div>

        {/* Absence Periods */}
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold">Absence Periods</h3>
            <p className="text-sm text-muted-foreground">
              Block specific dates for holidays or other commitments
            </p>
          </div>
          <OutOfOfficeManager />
        </div>

        {/* Global Save Bar */}
        <GlobalSaveBar
          show={hasUnsavedChanges}
          onSave={form.handleSubmit(onSubmit)}
          isSaving={isPending}
          error={error?.message}
        />
      </div>
    </TooltipProvider>
  );
}
