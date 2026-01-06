import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PriceInput } from "@/components/ui/price-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePackageSettings, useUpdatePackageSettings } from "../hooks/usePackageSettings";
import { Loader2, Package, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface PackageSettingsFormValues {
  sessions_1_price: number;
  sessions_1_duration: number; // kept for backend compatibility
  sessions_3_price: number;
  sessions_3_duration: number;
  sessions_5_price: number;
  sessions_5_duration: number;
  sessions_10_price: number;
  sessions_10_duration: number;
  sessions_15_price: number;
  sessions_15_duration: number;
  sessions_20_price: number;
  sessions_20_duration: number;
  lock_window_hours: number;
}

export function PackageSettingsForm() {
  const { data: settings, isLoading } = usePackageSettings();
  const { mutate: updateSettings, isPending } = useUpdatePackageSettings();

  const form = useForm<PackageSettingsFormValues>({
    defaultValues: {
      sessions_1_price: 5000,      // 50€
      sessions_1_duration: 1,
      sessions_3_price: 13500,     // 135€ (10% discount)
      sessions_3_duration: 2,
      sessions_5_price: 22500,     // 225€ (10% discount)
      sessions_5_duration: 3,
      sessions_10_price: 45000,    // 450€ (10% discount)
      sessions_10_duration: 6,
      sessions_15_price: 67500,    // 675€ (10% discount)
      sessions_15_duration: 9,
      sessions_20_price: 90000,    // 900€ (10% discount)
      sessions_20_duration: 12,
      lock_window_hours: 12,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        sessions_1_price: settings.sessions_1_price,
        sessions_1_duration: settings.sessions_1_duration,
        sessions_3_price: settings.sessions_3_price,
        sessions_3_duration: settings.sessions_3_duration,
        sessions_5_price: settings.sessions_5_price,
        sessions_5_duration: settings.sessions_5_duration,
        sessions_10_price: settings.sessions_10_price,
        sessions_10_duration: settings.sessions_10_duration,
        sessions_15_price: settings.sessions_15_price,
        sessions_15_duration: settings.sessions_15_duration,
        sessions_20_price: settings.sessions_20_price,
        sessions_20_duration: settings.sessions_20_duration,
        lock_window_hours: settings.lock_window_hours,
      });
    }
  }, [settings, form]);

  const onSubmit = (values: PackageSettingsFormValues) => {
    // Ensure single lesson price never goes to 0 - reset to default
    const finalValues = {
      ...values,
      sessions_1_price: values.sessions_1_price || 5000,
    };
    updateSettings(finalValues);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  // Calculate unit price
  const calculateUnitPrice = (totalCents: number, sessions: number) => {
    return totalCents / sessions;
  };

  // Calculate discount percentage
  const calculateDiscountPct = (unitPrice: number, singlePrice: number) => {
    if (singlePrice === 0) return 0;
    const discountAbs = singlePrice - unitPrice;
    return (discountAbs / singlePrice) * 100;
  };

  // Watch for real-time calculations
  const watchedValues = form.watch();
  const singleSessionPrice = watchedValues.sessions_1_price || 5000;

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
    { sessions: 3, priceField: "sessions_3_price" as const, durationField: "sessions_3_duration" as const },
    { sessions: 5, priceField: "sessions_5_price" as const, durationField: "sessions_5_duration" as const },
    { sessions: 10, priceField: "sessions_10_price" as const, durationField: "sessions_10_duration" as const },
    { sessions: 15, priceField: "sessions_15_price" as const, durationField: "sessions_15_duration" as const },
    { sessions: 20, priceField: "sessions_20_price" as const, durationField: "sessions_20_duration" as const },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lezioni e pacchetti</CardTitle>
        <CardDescription>
          Definisci il prezzo della lezione singola e i pacchetti disponibili
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Single Lesson Card - Separate */}
            <div className="p-5 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Lezione singola</h3>
              </div>
              
              <FormField
                control={form.control}
                name="sessions_1_price"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Prezzo lezione singola (€)</FormLabel>
                    <FormControl>
                      <PriceInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={() => {
                          // Reset to default if empty or 0
                          if (!field.value || field.value === 0) {
                            field.onChange(5000);
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                Questo prezzo viene usato quando crei un evento Lezione singola. 
                Puoi modificarlo di volta in volta durante la creazione dell'evento. 
                Il pagamento risulterà dovuto dopo l'evento o in caso di cancellazione tardiva.
              </p>
            </div>

            {/* Packages Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Pacchetti</h3>
                  <p className="text-sm text-muted-foreground">
                    Prezzi e durate di default per i pacchetti
                  </p>
                </div>
              </div>

              {packageTypes.map(({ sessions, priceField, durationField }) => {
                const totalPrice = watchedValues[priceField] || 0;
                const unitPrice = calculateUnitPrice(totalPrice, sessions);
                const discountAbs = singleSessionPrice - unitPrice;
                const discountPct = calculateDiscountPct(unitPrice, singleSessionPrice);
                
                return (
                  <div key={sessions} className="space-y-5 pb-6 border-b last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-5">
                      <Badge variant="secondary" className="text-base font-semibold px-3 py-1">
                        {sessions} Sessioni
                      </Badge>
                    </div>
                    
                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={priceField}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prezzo totale (€)</FormLabel>
                            <FormControl>
                              <PriceInput
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                              />
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
                                <SelectItem value="2">2 mesi</SelectItem>
                                <SelectItem value="3">3 mesi</SelectItem>
                                <SelectItem value="6">6 mesi</SelectItem>
                                <SelectItem value="9">9 mesi</SelectItem>
                                <SelectItem value="12">12 mesi</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Derived calculations */}
                    <div className="grid gap-5 md:grid-cols-2 pt-3 mt-3 p-3 rounded-lg bg-muted/20 border">
                      <div className="space-y-2">
                        <FormLabel className="text-sm font-medium text-foreground/70">Prezzo per sessione</FormLabel>
                        <div className="text-lg font-bold">
                          {formatCurrency(unitPrice)}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <FormLabel className="text-sm font-medium text-foreground/70">
                          Risparmio rispetto alla singola
                        </FormLabel>
                        <div className="flex items-center gap-3">
                          <div className="text-xl font-bold">
                            {discountAbs > 0 ? '−' : discountAbs < 0 ? '+' : ''}
                            {formatCurrency(Math.abs(discountAbs))}
                          </div>
                          <Badge 
                            variant={discountAbs > 0 ? "default" : discountAbs < 0 ? "destructive" : "secondary"}
                            className={cn(
                              "text-sm px-2.5 py-0.5 transition-all",
                              discountAbs > 0 && "bg-green-600 hover:bg-green-700 hover:scale-105"
                            )}
                          >
                            {discountPct > 0 ? '−' : discountPct < 0 ? '+' : ''}
                            {Math.abs(discountPct).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
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
                  "Salva"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
