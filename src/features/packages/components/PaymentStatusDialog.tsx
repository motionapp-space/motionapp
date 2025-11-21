import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PackagePaymentStatus } from "../types";
import { formatCurrency } from "../utils/kpi";
import { logClientActivity } from "@/features/clients/api/activities.api";

interface PaymentStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: PackagePaymentStatus;
  currentPartialPayment?: number;
  totalPrice?: number | null;
  packageId?: string;
  clientId?: string;
  packageName?: string;
  onSave: (newStatus: PackagePaymentStatus, partialPaymentCents?: number, note?: string) => void;
}

const PAYMENT_STATUS_OPTIONS = [
  { value: "unpaid" as const, label: "Non pagato" },
  { value: "partial" as const, label: "Parzialmente pagato" },
  { value: "paid" as const, label: "Pagato" },
  { value: "refunded" as const, label: "Rimborsato" },
];

export function PaymentStatusDialog({
  open,
  onOpenChange,
  currentStatus,
  currentPartialPayment = 0,
  totalPrice = null,
  packageId,
  clientId,
  packageName,
  onSave,
}: PaymentStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<PackagePaymentStatus>(currentStatus);
  const [note, setNote] = useState("");
  const [partialPaymentEuros, setPartialPaymentEuros] = useState<string>("");

  useEffect(() => {
    if (open) {
      setSelectedStatus(currentStatus);
      setPartialPaymentEuros(currentPartialPayment ? (currentPartialPayment / 100).toFixed(2) : "");
      setNote("");
    }
  }, [open, currentStatus, currentPartialPayment]);

  const handleSave = async () => {
    const partialCents = selectedStatus === 'partial' && partialPaymentEuros
      ? Math.round(parseFloat(partialPaymentEuros) * 100)
      : 0;
    
    onSave(selectedStatus, partialCents, note.trim() || undefined);
    
    // Log activity
    if (clientId && packageName) {
      const statusLabels: Record<PackagePaymentStatus, string> = {
        unpaid: "Non pagato",
        partial: "Parzialmente pagato",
        paid: "Pagato",
        refunded: "Rimborsato",
      };
      
      await logClientActivity(
        clientId,
        "PACKAGE_UPDATED",
        `Stato pagamento pacchetto "${packageName}" cambiato in: ${statusLabels[selectedStatus]}`
      );
    }
    
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const partialPaymentValue = partialPaymentEuros ? parseFloat(partialPaymentEuros) * 100 : 0;
  const remainingAmount = totalPrice ? totalPrice - partialPaymentValue : null;
  const isPartialValid = selectedStatus !== 'partial' || 
    (partialPaymentValue > 0 && (!totalPrice || partialPaymentValue < totalPrice));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifica stato pagamento</DialogTitle>
          <DialogDescription>
            Aggiorna manualmente lo stato del pagamento del pacchetto.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="payment-status">Stato pagamento</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as PackagePaymentStatus)}
            >
              <SelectTrigger id="payment-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStatus === 'partial' && (
            <div className="space-y-2">
              <Label htmlFor="partial-payment">Importo pagato (€)</Label>
              <Input
                id="partial-payment"
                type="number"
                step="0.01"
                min="0"
                max={totalPrice ? (totalPrice / 100).toString() : undefined}
                placeholder="Es: 150.00"
                value={partialPaymentEuros}
                onChange={(e) => setPartialPaymentEuros(e.target.value)}
              />
              {totalPrice && partialPaymentValue > 0 && remainingAmount !== null && (
                <p className="text-sm text-muted-foreground">
                  Rimanente: <span className="font-semibold">{formatCurrency(remainingAmount)}</span>
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="note">Note (opzionale)</Label>
            <Textarea
              id="note"
              placeholder="Aggiungi una nota per tracciare il motivo della modifica..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={!isPartialValid}>
            Salva modifiche
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
