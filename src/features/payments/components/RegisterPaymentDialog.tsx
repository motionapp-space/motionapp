import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PriceInput } from "@/components/ui/price-input";
import { useRegisterPayment } from "../hooks/useRegisterPayment";
import type { PaymentOrder } from "../types";

function formatEur(cents: number) {
  return (cents / 100).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PaymentOrder;
}

export function RegisterPaymentDialog({ open, onOpenChange, order }: Props) {
  const residuo = Math.max(0, order.amount_cents - order.paid_amount_cents);
  const [amountCents, setAmountCents] = useState(residuo);
  const registerPayment = useRegisterPayment();

  // Reset amount when dialog opens
  useEffect(() => {
    if (open) setAmountCents(residuo);
  }, [open, residuo]);

  const isValid = amountCents >= 1 && amountCents <= residuo;
  const isFullPayment = amountCents === residuo;
  const remaining = residuo - amountCents;

  const clientName = `${order.client_first_name} ${order.client_last_name}`;
  const isSingle = order.kind === "single_lesson";
  const orderTitle = isSingle
    ? `Lezione singola`
    : `Pacchetto ${order.package_name ?? ""}`;

  const handleConfirm = () => {
    if (!isValid) return;
    registerPayment.mutate(
      { orderId: order.id, amountCents },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registra pagamento</DialogTitle>
          <DialogDescription>
            {clientName} — {orderTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Importo
            </label>
            <PriceInput
              value={amountCents}
              onChange={setAmountCents}
            />
            <p className="text-xs text-muted-foreground">
              Residuo: {formatEur(residuo)}
            </p>
          </div>

          {isValid && (
            <p className="text-sm text-muted-foreground">
              {isFullPayment
                ? "Segnerai l'ordine come interamente pagato"
                : `Pagamento parziale: resteranno ${formatEur(remaining)} da incassare`}
            </p>
          )}

          {amountCents > residuo && (
            <p className="text-sm text-destructive">
              L'importo non può superare il residuo
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={registerPayment.isPending}
          >
            Annulla
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || registerPayment.isPending}
          >
            {registerPayment.isPending ? "Registrazione…" : "Conferma pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
