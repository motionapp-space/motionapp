import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Edit2, Calendar, FileText, CreditCard, Check, X, TrendingUp } from "lucide-react";
import { Package, PackagePaymentStatus } from "../types";
import { useUpdatePackage } from "../hooks/useUpdatePackage";
import { formatCurrency } from "../utils/kpi";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { PaymentStatusDialog } from "./PaymentStatusDialog";

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
  const [editMode, setEditMode] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [priceTotal, setPriceTotal] = useState("");
  const [notesInternal, setNotesInternal] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const updateMutation = useUpdatePackage();

  useEffect(() => {
    if (pkg) {
      setExpiresAt(pkg.expires_at ? format(new Date(pkg.expires_at), "yyyy-MM-dd") : "");
      setPriceTotal(pkg.price_total_cents ? (pkg.price_total_cents / 100).toString() : "");
      setNotesInternal(pkg.notes_internal || "");
      setEditMode(false);
    }
  }, [pkg]);

  const handleSave = async () => {
    if (!pkg) return;

    const changes: any = {};
    const newExpiresAt = expiresAt ? new Date(expiresAt).toISOString() : null;
    const newPriceCents = priceTotal ? Math.round(parseFloat(priceTotal) * 100) : null;

    if (newExpiresAt !== pkg.expires_at) changes.expires_at = newExpiresAt;
    if (newPriceCents !== pkg.price_total_cents) changes.price_total_cents = newPriceCents;
    if (notesInternal !== (pkg.notes_internal || "")) changes.notes_internal = notesInternal;

    if (Object.keys(changes).length > 0) {
      await updateMutation.mutateAsync({
        packageId: pkg.package_id,
        input: changes,
      });
    }
    
    setEditMode(false);
  };

  const handleCancel = () => {
    if (pkg) {
      setExpiresAt(pkg.expires_at ? format(new Date(pkg.expires_at), "yyyy-MM-dd") : "");
      setPriceTotal(pkg.price_total_cents ? (pkg.price_total_cents / 100).toString() : "");
      setNotesInternal(pkg.notes_internal || "");
    }
    setEditMode(false);
  };

  const handlePaymentStatusChange = async (
    newStatus: PackagePaymentStatus,
    partialPaymentCents?: number,
    note?: string
  ) => {
    if (!pkg) return;
    
    await updateMutation.mutateAsync({
      packageId: pkg.package_id,
      input: {
        payment_status: newStatus as any,
        partial_payment_cents: partialPaymentCents,
      },
    });
  };

  if (!pkg) return null;

  const usageStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    active: { label: "Attivo", variant: "default" },
    completed: { label: "Completato", variant: "secondary" },
    suspended: { label: "Sospeso", variant: "destructive" },
    archived: { label: "Archiviato", variant: "outline" },
  };

  const paymentStatusMap: Record<PackagePaymentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    unpaid: { label: "Non pagato", variant: "destructive" },
    partial: { label: "Parziale", variant: "secondary" },
    paid: { label: "Pagato", variant: "default" },
    refunded: { label: "Rimborsato", variant: "outline" },
  };

  const availableSessions = pkg.total_sessions - pkg.consumed_sessions - pkg.on_hold_sessions;
  const pricePerSession = pkg.price_total_cents && pkg.total_sessions > 0 
    ? pkg.price_total_cents / pkg.total_sessions 
    : null;

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
                <Badge variant={usageStatusMap[pkg.usage_status]?.variant || "default"} className="rounded-md">
                  {usageStatusMap[pkg.usage_status]?.label || pkg.usage_status}
                </Badge>
                <Badge variant={paymentStatusMap[pkg.payment_status]?.variant || "default"} className="rounded-md">
                  {paymentStatusMap[pkg.payment_status]?.label || pkg.payment_status}
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
                          {pkg.expires_at 
                            ? format(new Date(pkg.expires_at), "dd MMM yyyy", { locale: it })
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
                          {pkg.price_total_cents ? formatCurrency(pkg.price_total_cents) : "—"}
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
                        {pkg.notes_internal || "Nessuna nota"}
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
                      <p className="text-3xl font-bold" style={{ color: 'hsl(30, 80%, 55%)' }}>
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
                          className="h-full transition-all"
                          style={{ 
                            width: `${(pkg.on_hold_sessions / pkg.total_sessions) * 100}%`,
                            backgroundColor: 'hsl(30, 80%, 55%)'
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
                  <div className="flex justify-between items-center py-2">
                    <Label className="text-sm text-muted-foreground">Stato</Label>
                    <Badge variant={paymentStatusMap[pkg.payment_status]?.variant || "default"} className="rounded-md">
                      {paymentStatusMap[pkg.payment_status]?.label || pkg.payment_status}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center py-2">
                    <Label className="text-sm text-muted-foreground">Importo totale</Label>
                    <p className="text-lg font-semibold text-foreground">
                      {pkg.price_total_cents ? formatCurrency(pkg.price_total_cents) : "—"}
                    </p>
                  </div>

                  {pkg.payment_status === 'partial' && pkg.partial_payment_cents && (
                    <>
                      <div className="flex justify-between items-center py-2">
                        <Label className="text-sm text-muted-foreground">Importo pagato</Label>
                        <p className="text-lg font-semibold text-accent">
                          {formatCurrency(pkg.partial_payment_cents)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <Label className="text-sm text-muted-foreground">Rimanente</Label>
                        <p className="text-lg font-semibold text-destructive">
                          {formatCurrency((pkg.price_total_cents || 0) - pkg.partial_payment_cents)}
                        </p>
                      </div>
                    </>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setPaymentDialogOpen(true)}
                  >
                    Modifica stato pagamento
                  </Button>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Footer con azioni - sticky bottom */}
          <div className="px-6 py-4 border-t bg-background sticky bottom-0">
            {editMode ? (
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="flex-1"
                  disabled={updateMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annulla
                </Button>
                <Button 
                  onClick={handleSave}
                  className="flex-1"
                  disabled={updateMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Salvataggio..." : "Salva modifiche"}
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline"
                onClick={() => setEditMode(true)}
                className="w-full"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Modifica informazioni
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <PaymentStatusDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        currentStatus={pkg.payment_status as PackagePaymentStatus}
        currentPartialPayment={pkg.partial_payment_cents || 0}
        totalPrice={pkg.price_total_cents}
        packageId={pkg.package_id}
        clientId={pkg.client_id}
        packageName={pkg.name}
        onSave={handlePaymentStatusChange}
      />
    </>
  );
}
