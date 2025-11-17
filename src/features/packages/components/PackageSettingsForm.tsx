import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePackageSettings, useUpdatePackageSettings } from "../hooks/usePackageSettings";
import { Loader2, Package, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface PackageSettingsFormValues {
  sessions_1_price: number;
  sessions_1_duration: number;
  sessions_5_price: number;
  sessions_5_duration: number;
  sessions_10_price: number;
  sessions_10_duration: number;
  sessions_20_price: number;
  sessions_20_duration: number;
  lock_window_hours: number;
}

export function PackageSettingsForm() {
  const { data: settings, isLoading } = usePackageSettings();
  const { mutate: updateSettings, isPending } = useUpdatePackageSettings();

  const form = useForm<PackageSettingsFormValues>({
    defaultValues: {
      sessions_1_price: 5000,
      sessions_1_duration: 1,
      sessions_5_price: 22500,
      sessions_5_duration: 3,
      sessions_10_price: 40000,
      sessions_10_duration: 6,
      sessions_20_price: 70000,
      sessions_20_duration: 12,
      lock_window_hours: 12,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        sessions_1_price: settings.sessions_1_price,
        sessions_1_duration: settings.sessions_1_duration,
        sessions_5_price: settings.sessions_5_price,
        sessions_5_duration: settings.sessions_5_duration,
        sessions_10_price: settings.sessions_10_price,
        sessions_10_duration: settings.sessions_10_duration,
        sessions_20_price: settings.sessions_20_price,
        sessions_20_duration: settings.sessions_20_duration,
        lock_window_hours: settings.lock_window_hours,
      });
    }
  }, [settings, form]);

  const onSubmit = (values: PackageSettingsFormValues) => {
    updateSettings(values);
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  // Calcola prezzo per sessione
  const calculateUnitPrice = (totalCents: number, sessions: number) => {
    return totalCents / sessions;
  };

  // Calcola sconto assoluto
  const calculateDiscountAbs = (unitPrice: number, singlePrice: number) => {
    return singlePrice - unitPrice;
  };

  // Calcola sconto percentuale
  const calculateDiscountPct = (discountAbs: number, singlePrice: number) => {
    if (singlePrice === 0) return 0;
    return (discountAbs / singlePrice) * 100;
  };

  // Watch per calcoli in tempo reale
  const watchedValues = form.watch();
  const singleSessionPrice = watchedValues.sessions_1_price || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const packageTypes = [
    { sessions: 1, priceField: "sessions_1_price" as const, durationField: "sessions_1_duration" as const },
    { sessions: 5, priceField: "sessions_5_price" as const, durationField: "sessions_5_duration" as const },
    { sessions: 10, priceField: "sessions_10_price" as const, durationField: "sessions_10_duration" as const },
    { sessions: 20, priceField: "sessions_20_price" as const, durationField: "sessions_20_duration" as const },
  ];

  return (
    <Card>
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl">Impostazioni Pacchetti</CardTitle>
        <CardDescription className="text-base">
          Definisci prezzi e durate di default per ciascun tipo di pacchetto
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        {singleSessionPrice === 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Imposta un prezzo valido per la lezione singola per calcolare correttamente gli sconti.
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <TooltipProvider>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
            {packageTypes.map(({ sessions, priceField, durationField }) => {
              const totalPrice = watchedValues[priceField] || 0;
              const unitPrice = calculateUnitPrice(totalPrice, sessions);
              const discountAbs = sessions === 1 ? 0 : calculateDiscountAbs(unitPrice, singleSessionPrice);
              const discountPct = sessions === 1 ? 0 : calculateDiscountPct(discountAbs, singleSessionPrice);
              
              return (
              <div key={sessions} className="space-y-6 pb-8 border-b last:border-0 last:pb-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-lg font-semibold px-4 py-1.5">
                    {sessions} {sessions === 1 ? 'Sessione' : 'Sessioni'}
                  </Badge>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={priceField}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prezzo totale (€)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              value={formatPrice(field.value)}
                              onChange={(e) => field.onChange(Math.round(parseFloat(e.target.value) * 100))}
                              className="pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              €
                            </span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={durationField}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durata</FormLabel>
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
                            <SelectItem value="1">1 mese</SelectItem>
                            <SelectItem value="3">3 mesi</SelectItem>
                            <SelectItem value="6">6 mesi</SelectItem>
                            <SelectItem value="12">12 mesi</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Calcoli derivati */}
                <div className="grid gap-6 md:grid-cols-2 pt-4 mt-4 p-4 rounded-lg bg-muted/20 border">
                  <div className="space-y-2">
                    <FormLabel className="text-sm font-medium text-foreground/70">Prezzo per sessione</FormLabel>
                    <div className="text-xl font-bold">
                      {formatCurrency(unitPrice)}
                    </div>
                  </div>

                  {sessions > 1 && (
                    <div className="space-y-2">
                      <FormLabel className="text-sm font-medium text-foreground/70">
                        Sconto rispetto alla singola
                      </FormLabel>
                      <div className="flex items-center gap-3">
                        <div className="text-xl font-bold">
                          {discountAbs > 0 ? '−' : discountAbs < 0 ? '+' : ''}
                          {formatCurrency(Math.abs(discountAbs))}
                        </div>
                        <Badge 
                          variant={discountAbs > 0 ? "default" : discountAbs < 0 ? "destructive" : "secondary"}
                          className={cn(
                            "text-base px-3 py-1 transition-all",
                            discountAbs > 0 && "bg-green-600 hover:bg-green-700 hover:scale-105"
                          )}
                        >
                          {discountPct > 0 ? '−' : discountPct < 0 ? '+' : ''}
                          {Math.abs(discountPct).toFixed(2)}%
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              );
            })}

            <div className="pt-8 pb-6 px-6 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <FormField
                control={form.control}
                name="lock_window_hours"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>
                      <div className="flex items-center gap-2">
                        <FormLabel className="text-lg font-semibold m-0">Lock Window Post Evento</FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex">
                              <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>
                              Periodo di tempo dopo un evento durante il quale le sessioni del pacchetto 
                              vengono automaticamente "congelate". Previene modifiche retroattive che 
                              potrebbero alterare il conteggio delle sessioni consumate.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="12">12 ore</SelectItem>
                        <SelectItem value="24">24 ore</SelectItem>
                        <SelectItem value="48">48 ore</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-sm leading-relaxed mt-3">
                      Tempo dopo un evento entro cui è possibile modificare le sessioni nel pacchetto. 
                      Trascorso questo periodo, le modifiche all'evento non influenzeranno il conteggio 
                      delle sessioni consumate. <span className="font-medium text-foreground/80">Protegge l'integrità dei consumi.</span>
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                💡 Questi valori vengono proposti automaticamente quando crei un nuovo pacchetto.
                Puoi modificarli liberamente nella scheda cliente o mantenerli come default.
              </p>
              <Button type="submit" disabled={isPending} className="w-full md:w-auto min-w-[200px] h-11 text-base font-semibold">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  "Salva Tutte le Impostazioni"
                )}
              </Button>
            </div>
            </form>
          </TooltipProvider>
        </Form>
      </CardContent>
    </Card>
  );
}
