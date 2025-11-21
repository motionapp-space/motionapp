import { useState } from "react";
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
import { PackagePaymentStatus } from "../types";

interface PaymentStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: PackagePaymentStatus;
  onSave: (newStatus: PackagePaymentStatus, note?: string) => void;
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
  onSave,
}: PaymentStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<PackagePaymentStatus>(currentStatus);
  const [note, setNote] = useState("");

  const handleSave = () => {
    onSave(selectedStatus, note.trim() || undefined);
    onOpenChange(false);
    setNote("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedStatus(currentStatus);
      setNote("");
    }
    onOpenChange(newOpen);
  };

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
          <Button onClick={handleSave} disabled={selectedStatus === currentStatus}>
            Salva modifiche
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
