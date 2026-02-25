import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Edit2, FileText, CreditCard, Check, X, TrendingUp, History } from "lucide-react";
import { Package, PackagePaymentStatus } from "../types";
import { useUpdatePackage } from "../hooks/useUpdatePackage";
import { usePackageLedger } from "../hooks/usePackageLedger";
import { formatCurrency } from "../utils/kpi";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logClientActivity } from "@/features/clients/api/activities.api";
import { toast } from "sonner";
import { getCoachClientDetails } from "@/lib/coach-client";

interface PackageDetailsDrawerProps {
  package: Package | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAYMENT_STATUS_OPTIONS = [
  { value: "unpaid" as const, label: "Non pagato" },
  { value: "partial" as const, label: "Parzialmente pagato" },
  { value: "paid" as const, label: "Pagato" },
  { value: "refunded" as const, label: "Rimborsato" },
];

export function PackageDetailsDrawer({
  package: pkg,
  open,
  onOpenChange,
}: PackageDetailsDrawerProps) {
  const [editMode, setEditMode] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [priceTotal, setPriceTotal] = useState("");
  const [notesInternal, setNotesInternal] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PackagePaymentStatus>("unpaid");
  const [partialPaymentEuros, setPartialPaymentEuros] = useState("");

  const updateMutation = useUpdatePackage();
  const { data: ledgerEntries = [] } = usePackageLedger(pkg?.package_id);

  useEffect(() => {
    if (pkg) {
      setExpiresAt(pkg.expires_at ? format(new Date(pkg.expires_at), "yyyy-MM-dd") : "");
      setPriceTotal(pkg.price_total_cents ? (pkg.price_total_cents / 100).toString() : "");
      setNotesInternal(pkg.notes_internal || "");
      setPaymentStatus(pkg.payment_status as PackagePaymentStatus);
      setPartialPaymentEuros(pkg.partial_payment_cents ? (pkg.partial_payment_cents / 100).toFixed(2) : "");
      setEditMode(false);
    }
  }, [pkg, pkg?.expires_at, pkg?.price_total_cents, pkg?.notes_internal, pkg?.payment_status, pkg?.partial_payment_cents]);

  // Gestisce il cambio di payment_status
  useEffect(() => {
    if (editMode && paymentStatus === 'partial' && !partialPaymentEuros && pkg) {
      // Se passa a 'partial' e il campo è vuoto, inizializza con il valore del database
      if (pkg.partial_payment_cents) {
        setPartialPaymentEuros((pkg.partial_payment_cents / 100).toFixed(2));
      }
    }
  }, [paymentStatus, editMode, pkg, partialPaymentEuros]);

  const handleSave = async () => {
    if (!pkg) return;

    const changes: any = {};
    const newExpiresAt = expiresAt ? new Date(expiresAt).toISOString() : null;
    const newPriceCents = priceTotal ? Math.round(parseFloat(priceTotal) * 100) : pkg.price_total_cents;

    if (newExpiresAt !== pkg.expires_at) changes.expires_at = newExpiresAt;
    if (priceTotal && newPriceCents !== pkg.price_total_cents) changes.price_total_cents = newPriceCents;
    if (notesInternal !== (pkg.notes_internal || "")) changes.notes_internal = notesInternal;
    
    // Gestione payment_status
    if (paymentStatus !== pkg.payment_status) {
      changes.payment_status = paymentStatus;
    }

    // Gestione partial_payment SEMPRE quando status è 'partial'
    if (paymentStatus === 'partial') {
      const partialValue = partialPaymentEuros ? parseFloat(partialPaymentEuros) : 0;
      const totalValue = newPriceCents / 100;
      
      // Validazione
      if (partialValue < 0) {
        toast.error("L'importo pagato non può essere negativo");
        return;
      }
      if (partialValue > totalValue) {
        toast.error("L'importo pagato non può superare il totale");
        return;
      }
      if (partialValue === 0) {
        toast.error("Inserisci un importo pagato valido");
        return;
      }
      
      const newPartialPaymentCents = Math.round(partialValue * 100);
      if (newPartialPaymentCents !== pkg.partial_payment_cents) {
        changes.partial_payment_cents = newPartialPaymentCents;
      }
    } else {
      // Se non è 'partial', azzera l'importo parziale
      if (pkg.partial_payment_cents !== null) {
        changes.partial_payment_cents = null;
      }
    }

    if (Object.keys(changes).length === 0) {
      toast.info("Nessuna modifica da salvare");
      setEditMode(false);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        packageId: pkg.package_id,
        input: changes,
      });

      // Log activity for payment status change
      if (changes.payment_status) {
        const statusLabels: Record<PackagePaymentStatus, string> = {
          unpaid: "Non pagato",
          partial: "Parzialmente pagato",
          paid: "Pagato",
          refunded: "Rimborsato"
        };
        
        // Get client_id from coach_client relationship
        const details = await getCoachClientDetails(pkg.coach_client_id);
        
        await logClientActivity(
          details.client_id,
          "PACKAGE_UPDATED",
          `Stato pagamento pacchetto "${pkg.name}" modificato in: ${statusLabels[paymentStatus]}`
        );
      }

      // Aggiorna gli stati locali con i valori appena salvati per un feedback immediato
      if (changes.expires_at !== undefined) {
        setExpiresAt(changes.expires_at ? format(new Date(changes.expires_at), "yyyy-MM-dd") : "");
      }
      if (changes.price_total_cents !== undefined) {
        setPriceTotal((changes.price_total_cents / 100).toString());
      }
      if (changes.notes_internal !== undefined) {
        setNotesInternal(changes.notes_internal);
      }
      if (changes.payment_status !== undefined) {
        setPaymentStatus(changes.payment_status);
      }
      if (changes.partial_payment_cents !== undefined) {
        setPartialPaymentEuros(changes.partial_payment_cents ? (changes.partial_payment_cents / 100).toFixed(2) : "");
      } else if (paymentStatus !== 'partial' && pkg.partial_payment_cents) {
        // Se lo stato non è più partial, resetta l'importo parziale visualizzato
        setPartialPaymentEuros("");
      }

      setEditMode(false);
      toast.success("Modifiche salvate con successo");
    } catch (error) {
      toast.error("Errore nel salvataggio delle modifiche");
    }
  };

  const handleCancel = () => {
    if (pkg) {
      setExpiresAt(pkg.expires_at ? format(new Date(pkg.expires_at), "yyyy-MM-dd") : "");
      setPriceTotal(pkg.price_total_cents ? (pkg.price_total_cents / 100).toString() : "");
      setNotesInternal(pkg.notes_internal || "");
      setPaymentStatus(pkg.payment_status as PackagePaymentStatus);
      setPartialPaymentEuros(pkg.partial_payment_cents ? (pkg.partial_payment_cents / 100).toFixed(2) : "");
    }
    setEditMode(false);
  };

  if (!pkg) return null;

  const usageStatusMap: Record<string, { label: string; className: string }> = {
    active: { label: "Attivo", className: "border-success/50 bg-success/10 text-foreground dark:text-success" },
    completed: { label: "Completato", className: "border-warning/50 bg-warning/10 text-foreground dark:text-warning" },
    suspended: { label: "Sospeso", className: "border-destructive/50 bg-destructive/10 text-foreground dark:text-destructive" },
    archived: { label: "Archiviato", className: "border-muted-foreground/50 bg-muted-foreground/10 text-foreground dark:text-muted-foreground" },
  };

  const paymentStatusMap: Record<PackagePaymentStatus, { label: string; className: string }> = {
    unpaid: { label: "Non pagato", className: "border-destructive/50 bg-destructive/10 text-foreground dark:text-destructive" },
    partial: { label: "Parziale", className: "border-warning/50 bg-warning/10 text-foreground dark:text-warning" },
    paid: { label: "Pagato", className: "border-success/50 bg-success/10 text-foreground dark:text-success" },
    refunded: { label: "Rimborsato", className: "border-muted-foreground/50 bg-muted-foreground/10 text-foreground dark:text-muted-foreground" },
  };

  const availableSessions = pkg.total_sessions - pkg.consumed_sessions - pkg.on_hold_sessions;
  const effectivePriceTotalCents = priceTotal ? Math.round(parseFloat(priceTotal) * 100) : pkg.price_total_cents;
  const pricePerSession = effectivePriceTotalCents && pkg.total_sessions > 0
    ? effectivePriceTotalCents / pkg.total_sessions
    : null;

  // Helper per label ledger minimali
  const getSimpleLabel = (type: string, reason: string) => {
    const key = `${type}-${reason}`;
    const labels: Record<string, string> = {
      'HOLD_CREATE-CONFIRM': '📅 Credito prenotato',
      'HOLD_RELEASE-CANCEL_GT_24H': '↩️ Credito restituito',
      'CONSUME-COMPLETE': '✅ Sessione completata',
      'CONSUME-CANCEL_LT_24H': '⚠️ Cancellazione tardiva',
      'CORRECTION-ADMIN_CORRECTION': '✏️ Correzione manuale',
    };
    return labels[key] || `${type} (${reason})`;
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-2xl p-0">
          {/* Header con padding personalizzato */}
          <div className="px-6 pt-6 pb-4 border-b bg-background sticky top-0 z-10">
            <SheetHeader>
              <SheetTitle className="text-2xl font-semibold text-foreground">
                {pkg.name}
              </SheetTitle>
              <div className="flex gap-2 mt-3">
                <Badge variant="outline" className={cn("rounded-md", usageStatusMap[pkg.usage_status]?.className)}>
                  {usageStatusMap[pkg.usage_status]?.label || pkg.usage_status}
                </Badge>
                <Badge variant="outline" className={cn("rounded-md", paymentStatusMap[paymentStatus]?.className)}>
                  {paymentStatusMap[paymentStatus]?.label || paymentStatus}
                </Badge>
              </div>
            </SheetHeader>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-8">
            {/* Informazioni Generali */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Informazioni Generali</h3>
              </div>
              
              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-1.5 block">Data creazione</Label>
                      <p className="text-base text-foreground">
                        {format(new Date(pkg.created_at), "dd MMM yyyy", { locale: it })}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-muted-foreground mb-1.5 block">Data scadenza</Label>
                      {editMode ? (
                        <Input
                          type="date"
                          value={expiresAt}
                          onChange={(e) => setExpiresAt(e.target.value)}
                          className="h-10"
                        />
                      ) : (
                        <p className="text-base text-foreground">
                          {expiresAt
                            ? format(new Date(expiresAt), "dd MMM yyyy", { locale: it })
                            : "—"}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground mb-1.5 block">Durata</Label>
                      <p className="text-base text-foreground">
                        {pkg.duration_months} {pkg.duration_months === 1 ? 'mese' : 'mesi'}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground mb-1.5 block">Prezzo totale</Label>
                      {editMode ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={priceTotal}
                          onChange={(e) => setPriceTotal(e.target.value)}
                          className="h-10"
                          placeholder="Es: 400.00"
                        />
                      ) : (
                        <p className="text-base font-semibold text-foreground">
                          {effectivePriceTotalCents ? formatCurrency(effectivePriceTotalCents) : "—"}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground mb-1.5 block">Prezzo unitario</Label>
                      <p className="text-base text-foreground">
                        {pricePerSession ? formatCurrency(Math.round(pricePerSession)) : "—"}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground mb-1.5 block">Fonte prezzo</Label>
                      <p className="text-base text-foreground">
                        {pkg.price_source === 'settings' ? 'Listino' : 'Personalizzato'}
                      </p>
                    </div>

                    {pkg.payment_method && (
                      <div className="col-span-2">
                        <Label className="text-sm text-muted-foreground mb-1.5 block">Metodo pagamento</Label>
                        <p className="text-base text-foreground capitalize">{pkg.payment_method}</p>
                      </div>
                    )}
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Note interne</Label>
                    {editMode ? (
                      <Textarea
                        value={notesInternal}
                        onChange={(e) => setNotesInternal(e.target.value)}
                        placeholder="Aggiungi note interne..."
                        rows={3}
                        className="resize-none"
                      />
                    ) : (
                      <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 rounded-md p-3 min-h-[60px]">
                        {notesInternal || "Nessuna nota"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>

            <Separator />

            {/* Statistiche Utilizzo */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Statistiche Utilizzo</h3>
              </div>

              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="grid grid-cols-4 gap-6 mb-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Totali</p>
                      <p className="text-3xl font-bold text-foreground">{pkg.total_sessions}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Completate</p>
                      <p className="text-3xl font-bold text-accent">{pkg.consumed_sessions}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">In attesa</p>
                      <p className="text-3xl font-bold text-muted-foreground">
                        {pkg.on_hold_sessions}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Disponibili</p>
                      <p className="text-3xl font-bold text-primary">{availableSessions}</p>
                    </div>
                  </div>

                  <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                    <div className="h-full flex">
                      {pkg.consumed_sessions > 0 && (
                        <div 
                          className="h-full bg-accent transition-all"
                          style={{ width: `${(pkg.consumed_sessions / pkg.total_sessions) * 100}%` }}
                          title={`Completate: ${pkg.consumed_sessions}`}
                        />
                      )}
                      {pkg.on_hold_sessions > 0 && (
                        <div 
                          className="h-full bg-muted-foreground/60 transition-all"
                          style={{ 
                            width: `${(pkg.on_hold_sessions / pkg.total_sessions) * 100}%`
                          }}
                          title={`In attesa: ${pkg.on_hold_sessions}`}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Separator />

            {/* Pagamento */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Pagamento</h3>
              </div>

              <Card className="border-border">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Stato pagamento</Label>
                    {editMode ? (
                      <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PackagePaymentStatus)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={paymentStatusMap[paymentStatus]?.className}>
                        {paymentStatusMap[paymentStatus]?.label || paymentStatus}
                      </Badge>
                    )}
                  </div>

                  {(editMode && paymentStatus === 'partial') && (
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Importo pagato (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={partialPaymentEuros}
                        onChange={(e) => setPartialPaymentEuros(e.target.value)}
                        placeholder="Es: 200.00"
                        className="h-10"
                      />
                    </div>
                  )}

                  {!editMode && paymentStatus === 'partial' && pkg.partial_payment_cents && (
                    <div>
                      <Label className="text-sm text-muted-foreground mb-1.5 block">Importo pagato</Label>
                      <p className="text-base text-foreground">
                        {formatCurrency(pkg.partial_payment_cents)} / {formatCurrency(effectivePriceTotalCents || 0)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <Separator />

            {/* Storico Movimenti */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Storico Movimenti</h3>
              </div>

              <Card className="border-border">
                <CardContent className="p-4">
                  {ledgerEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nessun movimento registrato
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {ledgerEntries.slice(0, 10).map((entry) => (
                        <div
                          key={entry.ledger_id}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {getSimpleLabel(entry.type, entry.reason)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(entry.created_at), "dd MMM yyyy HH:mm", { locale: it })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t bg-background sticky bottom-0">
            {editMode ? (
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Annulla
                </Button>
                <Button onClick={handleSave} className="flex-1" disabled={updateMutation.isPending}>
                  <Check className="h-4 w-4 mr-2" />
                  Salva
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setEditMode(true)} className="w-full">
                <Edit2 className="h-4 w-4 mr-2" />
                Modifica
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
