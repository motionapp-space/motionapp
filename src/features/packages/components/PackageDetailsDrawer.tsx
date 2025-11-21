import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package } from "../types";
import { usePackageLedger } from "../hooks/usePackageLedger";
import { useUpdatePackage } from "../hooks/useUpdatePackage";
import { calculatePackageKPI, formatCurrency, getUsageStatusInfo, getPaymentStatusInfo } from "../utils/kpi";
import { PackageStatsBar } from "./PackageStatsBar";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  FileText, 
  Info, 
  Save,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { toast } from "sonner";

interface PackageDetailsDrawerProps {
  package: Package | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PackageDetailsDrawer({
  package: pkg,
  open,
  onOpenChange,
}: PackageDetailsDrawerProps) {
  const { data: ledgerEntries, isLoading: ledgerLoading } = usePackageLedger(pkg?.package_id);
  const updateMutation = useUpdatePackage();
  
  const [expiresAt, setExpiresAt] = useState("");
  const [priceTotal, setPriceTotal] = useState("");
  const [notesInternal, setNotesInternal] = useState("");
  
  // Initialize form when package changes
  useEffect(() => {
    if (pkg) {
      setExpiresAt(pkg.expires_at ? format(new Date(pkg.expires_at), "yyyy-MM-dd") : "");
      setPriceTotal(pkg.price_total_cents ? (pkg.price_total_cents / 100).toString() : "");
      setNotesInternal(pkg.notes_internal || "");
    }
  }, [pkg]);

  if (!pkg) return null;

  const kpi = calculatePackageKPI(pkg);
  const usageInfo = getUsageStatusInfo(pkg.usage_status as any);
  const paymentInfo = getPaymentStatusInfo(pkg.payment_status as any);

  const handleSave = () => {
    const updates: any = {};
    
    if (expiresAt && expiresAt !== (pkg.expires_at ? format(new Date(pkg.expires_at), "yyyy-MM-dd") : "")) {
      updates.expires_at = new Date(expiresAt).toISOString();
    }
    
    if (priceTotal) {
      const priceCents = Math.round(parseFloat(priceTotal) * 100);
      if (priceCents !== pkg.price_total_cents) {
        updates.price_total_cents = priceCents;
      }
    }
    
    if (notesInternal !== pkg.notes_internal) {
      updates.notes_internal = notesInternal;
    }

    if (Object.keys(updates).length === 0) {
      toast.info("Nessuna modifica da salvare");
      return;
    }

    updateMutation.mutate({
      packageId: pkg.package_id,
      input: updates,
    }, {
      onSuccess: () => {
        toast.success("Modifiche salvate");
      },
    });
  };

  const getLedgerIcon = (type: string, deltaConsumed: number, deltaHold: number) => {
    if (deltaConsumed > 0) return <ArrowDown className="h-4 w-4 text-destructive" />;
    if (deltaConsumed < 0) return <ArrowUp className="h-4 w-4 text-success" />;
    if (deltaHold > 0) return <Clock className="h-4 w-4 text-info" />;
    if (deltaHold < 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  const getLedgerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      HOLD_CREATE: "Prenotazione",
      HOLD_RELEASE: "Rilascio",
      CONSUME: "Consumo",
      CORRECTION: "Correzione",
      PRICE_UPDATE: "Modifica prezzo",
    };
    return labels[type] || type;
  };

  const getLedgerReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      CONFIRM: "Conferma appuntamento",
      CANCEL_GT_24H: "Cancellazione >24h",
      CANCEL_LT_24H: "Cancellazione <24h",
      COMPLETE: "Completamento",
      ADMIN_CORRECTION: "Correzione manuale",
      RECONCILE: "Riconciliazione",
    };
    return labels[reason] || reason;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {pkg.name}
            <Badge variant={pkg.usage_status === 'active' ? 'default' : 'secondary'}>
              {usageInfo.label}
            </Badge>
            <Badge variant={pkg.payment_status === 'paid' ? 'default' : 'outline'}>
              {paymentInfo.label}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Dettagli completi del pacchetto e storico transazioni
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Generale</TabsTrigger>
            <TabsTrigger value="ledger">Ledger</TabsTrigger>
            <TabsTrigger value="payments">Pagamenti</TabsTrigger>
            <TabsTrigger value="edit">Modifica</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Informazioni generali
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Data creazione</p>
                    <p className="font-medium">{format(new Date(pkg.created_at), "d MMM yyyy", { locale: it })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data scadenza</p>
                    <p className="font-medium">
                      {pkg.expires_at ? format(new Date(pkg.expires_at), "d MMM yyyy", { locale: it }) : "Nessuna"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Durata</p>
                    <p className="font-medium">{pkg.duration_months} {pkg.duration_months === 1 ? 'mese' : 'mesi'}</p>
                  </div>
                  {pkg.price_total_cents !== null && (
                    <>
                      <div>
                        <p className="text-muted-foreground">Prezzo totale</p>
                        <p className="font-medium">{formatCurrency(pkg.price_total_cents)}</p>
                      </div>
                      {kpi.price_per_session !== null && (
                        <div>
                          <p className="text-muted-foreground">Prezzo unitario</p>
                          <p className="font-medium">{formatCurrency(kpi.price_per_session)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Fonte prezzo</p>
                        <p className="font-medium">
                          {pkg.price_source === 'custom' ? 'Personalizzato' : 'Da impostazioni'}
                        </p>
                      </div>
                    </>
                  )}
                  {pkg.payment_method && (
                    <div>
                      <p className="text-muted-foreground">Metodo pagamento</p>
                      <p className="font-medium">{pkg.payment_method}</p>
                    </div>
                  )}
                </div>

                {pkg.is_single_technical && (
                  <Alert className="bg-info/10 border-info">
                    <Info className="h-4 w-4 text-info" />
                    <AlertDescription className="text-sm">
                      Questo è un pacchetto tecnico creato automaticamente per una singola sessione.
                    </AlertDescription>
                  </Alert>
                )}

                {pkg.notes_internal && (
                  <div>
                    <Label className="text-muted-foreground">Note interne</Label>
                    <p className="mt-1 text-sm p-3 bg-muted rounded-lg">{pkg.notes_internal}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Statistiche di utilizzo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PackageStatsBar
                  stats={[
                    { label: "Totali", value: kpi.total },
                    { label: "Completate", value: kpi.consumed },
                    { 
                      label: "Prenotate", 
                      value: kpi.on_hold,
                      highlight: kpi.on_hold > 0 ? 'info' : undefined
                    },
                    { 
                      label: "Disponibili", 
                      value: kpi.available,
                      highlight: kpi.available > 0 ? 'success' : undefined
                    },
                  ]}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ledger Tab */}
          <TabsContent value="ledger" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Storico transazioni</CardTitle>
                <CardDescription>
                  Tutte le operazioni effettuate sul pacchetto
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ledgerLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Caricamento...</p>
                ) : !ledgerEntries || ledgerEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nessuna transazione</p>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead className="text-right">Δ Consumate</TableHead>
                          <TableHead className="text-right">Δ In attesa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ledgerEntries.map((entry) => (
                          <TableRow key={entry.ledger_id}>
                            <TableCell className="text-sm">
                              {format(new Date(entry.created_at), "d MMM yyyy HH:mm", { locale: it })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getLedgerIcon(entry.type, entry.delta_consumed, entry.delta_hold)}
                                <span className="text-sm">{getLedgerTypeLabel(entry.type)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div>
                                {getLedgerReasonLabel(entry.reason)}
                                {entry.event_title && (
                                  <p className="text-xs text-muted-foreground">{entry.event_title}</p>
                                )}
                                {entry.note && (
                                  <p className="text-xs text-muted-foreground italic">{entry.note}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {entry.delta_consumed !== 0 && (
                                <span className={entry.delta_consumed > 0 ? "text-destructive" : "text-success"}>
                                  {entry.delta_consumed > 0 ? '+' : ''}{entry.delta_consumed}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {entry.delta_hold !== 0 && (
                                <span className={entry.delta_hold > 0 ? "text-info" : "text-muted-foreground"}>
                                  {entry.delta_hold > 0 ? '+' : ''}{entry.delta_hold}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Stato pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Stato</p>
                    <Badge variant={pkg.payment_status === 'paid' ? 'default' : 'outline'} className="mt-1">
                      {paymentInfo.label}
                    </Badge>
                  </div>
                  {pkg.price_total_cents !== null && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Importo totale</p>
                        <p className="font-semibold mt-1">{formatCurrency(pkg.price_total_cents)}</p>
                      </div>
                      {pkg.payment_status === 'partial' && pkg.partial_payment_cents !== null && (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground">Pagato</p>
                            <p className="font-semibold mt-1 text-success">{formatCurrency(pkg.partial_payment_cents)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Rimanente</p>
                            <p className="font-semibold mt-1 text-destructive">
                              {formatCurrency(pkg.price_total_cents - pkg.partial_payment_cents)}
                            </p>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                <Alert className="bg-info/10 border-info">
                  <Info className="h-4 w-4 text-info" />
                  <AlertDescription className="text-sm">
                    Per modificare lo stato di pagamento, utilizza il menu azioni nella card del pacchetto.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent value="edit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Modifica informazioni</CardTitle>
                <CardDescription>
                  Modifica scadenza, prezzo e note interne del pacchetto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expires_at" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data di scadenza
                  </Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Dopo questa data non sarà possibile creare nuove prenotazioni
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="price_total" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Prezzo totale (€)
                  </Label>
                  <Input
                    id="price_total"
                    type="number"
                    step="0.01"
                    value={priceTotal}
                    onChange={(e) => setPriceTotal(e.target.value)}
                    placeholder="Es: 250.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Modifica il prezzo totale del pacchetto
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="notes_internal" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Note interne
                  </Label>
                  <Textarea
                    id="notes_internal"
                    value={notesInternal}
                    onChange={(e) => setNotesInternal(e.target.value)}
                    placeholder="Aggiungi note private sul pacchetto..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Queste note sono visibili solo a te
                  </p>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="w-full gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateMutation.isPending ? "Salvataggio..." : "Salva modifiche"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
