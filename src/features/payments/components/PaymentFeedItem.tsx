import { useState } from "react";
import { Check, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RegisterPaymentDialog } from "./RegisterPaymentDialog";
import { useRegisterPayment } from "../hooks/useRegisterPayment";
import { useResetPayment } from "../hooks/useResetPayment";
import type { PaymentOrder } from "../types";

function formatEur(cents: number) {
  return (cents / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

interface Props {
  order: PaymentOrder;
}

export function PaymentFeedItem({ order }: Props) {
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [resetAlertOpen, setResetAlertOpen] = useState(false);
  const registerPayment = useRegisterPayment();
  const resetPayment = useResetPayment();

  const residuo = Math.max(0, order.amount_cents - order.paid_amount_cents);
  const isOutstanding = residuo > 0;
  const isPartial = order.paid_amount_cents > 0 && residuo > 0;
  const isSingle = order.kind === "single_lesson";
  const isFree = order.amount_cents === 0;

  // Title
  const title = isSingle
    ? `Lezione del ${order.event_start_at ? format(new Date(order.event_start_at), "d MMM yyyy", { locale: it }) : "—"}`
    : `Pacchetto ${order.package_name ?? "—"}`;

  const clientName = `${order.client_first_name} ${order.client_last_name}`;

  // Due status (only for single lessons)
  const now = new Date();
  const isDueNow = isSingle && order.event_start_at != null && new Date(order.event_start_at) < now;
  const hasEventDate = isSingle && order.event_start_at != null;

  return (
    <>
      <div className="flex items-center gap-4 py-4 px-6 hover:bg-muted/30 transition-colors duration-150">
        {/* Left block */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{title}</p>
          <p className="text-sm text-muted-foreground">{clientName}</p>
          <div className="flex items-center gap-2 mt-1">
            {isSingle ? (
              <>
                <span className="text-xs text-muted-foreground">
                  {hasEventDate
                    ? format(new Date(order.event_start_at!), "d MMM yyyy · HH:mm", { locale: it })
                    : "Data lezione non disponibile"}
                </span>
                {isOutstanding && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 border-0 ${
                      isDueNow
                        ? "bg-foreground/5 text-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDueNow ? "Già dovuta" : "Non ancora dovuta"}
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                Venduto il {format(new Date(order.created_at), "d MMM yyyy", { locale: it })}
              </span>
            )}
          </div>
        </div>

        {/* Center block */}
        <div className="shrink-0 flex items-center gap-1.5">
          {isOutstanding ? (
            <Badge variant="outline" className="border-0 bg-foreground/5 text-foreground text-xs">
              Da incassare
            </Badge>
          ) : (
            <Badge variant="outline" className="border-0 bg-emerald-50 text-emerald-700 text-xs">
              Pagato
            </Badge>
          )}
          {isPartial && (
            <Badge variant="outline" className="border-0 bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0">
              Parziale
            </Badge>
          )}
        </div>

        {/* Right block */}
        <div className="shrink-0 text-right tabular-nums">
          {isOutstanding ? (
            <>
              <p className="text-sm font-semibold">{formatEur(residuo)}</p>
              <p className="text-xs text-muted-foreground">
                {isPartial
                  ? `Pagato ${formatEur(order.paid_amount_cents)} · Totale ${formatEur(order.amount_cents)}`
                  : `Totale ${formatEur(order.amount_cents)}`}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold">{formatEur(order.amount_cents)}</p>
              {order.paid_at && (
                <p className="text-xs text-muted-foreground">
                  Pagato il {format(new Date(order.paid_at), "d MMM yyyy", { locale: it })}
                </p>
              )}
            </>
          )}
        </div>

        {/* CTA */}
        {isOutstanding && (
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0 text-xs gap-1"
            disabled={isSingle && registerPayment.isPending}
            onClick={() => {
              if (isSingle) {
                registerPayment.mutate({ orderId: order.id, amountCents: residuo });
              } else {
                setPayDialogOpen(true);
              }
            }}
          >
            <Check className="h-3.5 w-3.5" />
            {isSingle && registerPayment.isPending ? "Registrazione…" : "Registra pagamento"}
          </Button>
        )}

        {/* Menu for paid (non-free) orders */}
        {!isOutstanding && !isFree && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="shrink-0 h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setResetAlertOpen(true)}>
                Ripristina come da incassare
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Register payment dialog (only for packages) */}
      {!isSingle && (
        <RegisterPaymentDialog
          open={payDialogOpen}
          onOpenChange={setPayDialogOpen}
          order={order}
        />
      )}

      {/* Reset confirmation */}
      <AlertDialog open={resetAlertOpen} onOpenChange={setResetAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annullare il pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Il pagamento registrato verrà azzerato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetPayment.isPending}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={resetPayment.isPending}
              onClick={() =>
                resetPayment.mutate(order.id, {
                  onSuccess: () => setResetAlertOpen(false),
                })
              }
            >
              Conferma
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
