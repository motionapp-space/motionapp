import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Edit2, Calendar, Euro, FileText, CreditCard, TrendingUp } from "lucide-react";
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
        <SheetContent className="overflow-y-auto w-full sm:max-w-2xl">
          <SheetHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <SheetTitle>{pkg.name}</SheetTitle>
              <div className="flex gap-2 mt-2">
                <Badge variant={usageStatusMap[pkg.usage_status]?.variant || "default"}>
                  {usageStatusMap[pkg.usage_status]?.label || pkg.usage_status}
                </Badge>
                <Badge variant={paymentStatusMap[pkg.payment_status]?.variant || "default"}>
                  {paymentStatusMap[pkg.payment_status]?.label || pkg.payment_status}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditMode(!editMode)}
              className="shrink-0"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Informazioni Generali */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Informazioni Generali</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Data creazione</Label>
                  <p className="mt-1">
                    {format(new Date(pkg.created_at), "dd MMM yyyy", { locale: it })}
                  </p>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Data scadenza</Label>
                  {editMode ? (
                    <Input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1">
                      {pkg.expires_at 
                        ? format(new Date(pkg.expires_at), "dd MMM yyyy", { locale: it })
                        : "—"}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">Durata</Label>
                  <p className="mt-1">{pkg.duration_months} {pkg.duration_months === 1 ? 'mese' : 'mesi'}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Prezzo totale</Label>
                  {editMode ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={priceTotal}
                      onChange={(e) => setPriceTotal(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 font-semibold">
                      {pkg.price_total_cents ? formatCurrency(pkg.price_total_cents) : "—"}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">Prezzo unitario</Label>
                  <p className="mt-1">
                    {pricePerSession ? formatCurrency(Math.round(pricePerSession)) : "—"}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Fonte prezzo</Label>
                  <p className="mt-1">{pkg.price_source === 'settings' ? 'Listino' : 'Personalizzato'}</p>
                </div>

                {pkg.payment_method && (
                  <div>
                    <Label className="text-muted-foreground">Metodo pagamento</Label>
                    <p className="mt-1 capitalize">{pkg.payment_method}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground">Note interne</Label>
                {editMode ? (
                  <Textarea
                    value={notesInternal}
                    onChange={(e) => setNotesInternal(e.target.value)}
                    placeholder="Aggiungi note interne..."
                    rows={3}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm whitespace-pre-wrap">
                    {pkg.notes_internal || "—"}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Statistiche Utilizzo */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Statistiche Utilizzo</h3>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Totali</Label>
                  <p className="text-2xl font-bold">{pkg.total_sessions}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Completate</Label>
                  <p className="text-2xl font-bold text-green-600">{pkg.consumed_sessions}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">In attesa</Label>
                  <p className="text-2xl font-bold text-orange-600">{pkg.on_hold_sessions}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Disponibili</Label>
                  <p className="text-2xl font-bold text-blue-600">{availableSessions}</p>
                </div>
              </div>

              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div className="h-full flex">
                  {pkg.consumed_sessions > 0 && (
                    <div 
                      className="bg-green-600 h-full"
                      style={{ width: `${(pkg.consumed_sessions / pkg.total_sessions) * 100}%` }}
                    />
                  )}
                  {pkg.on_hold_sessions > 0 && (
                    <div 
                      className="bg-orange-600 h-full"
                      style={{ width: `${(pkg.on_hold_sessions / pkg.total_sessions) * 100}%` }}
                    />
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Pagamento */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Pagamento</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-muted-foreground">Stato</Label>
                  <Badge variant={paymentStatusMap[pkg.payment_status]?.variant || "default"}>
                    {paymentStatusMap[pkg.payment_status]?.label || pkg.payment_status}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <Label className="text-muted-foreground">Importo totale</Label>
                  <p className="font-semibold">
                    {pkg.price_total_cents ? formatCurrency(pkg.price_total_cents) : "—"}
                  </p>
                </div>

                {pkg.payment_status === 'partial' && pkg.partial_payment_cents && (
                  <>
                    <div className="flex justify-between items-center">
                      <Label className="text-muted-foreground">Importo pagato</Label>
                      <p className="text-green-600 font-semibold">
                        {formatCurrency(pkg.partial_payment_cents)}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <Label className="text-muted-foreground">Rimanente</Label>
                      <p className="text-orange-600 font-semibold">
                        {formatCurrency((pkg.price_total_cents || 0) - pkg.partial_payment_cents)}
                      </p>
                    </div>
                  </>
                )}

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setPaymentDialogOpen(true)}
                >
                  Modifica stato pagamento
                </Button>
              </div>
            </div>

            {editMode && (
              <>
                <Separator />
                <Button onClick={handleSave} className="w-full" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Salvataggio..." : "Salva modifiche"}
                </Button>
              </>
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
