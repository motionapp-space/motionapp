import { useState } from "react";
import { Check, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
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

  // Shared badge classes
  const badgeMainClass = cn(
    "h-7 min-w-[120px] justify-center px-3 text-xs font-medium",
    isOutstanding
      ? "border-border bg-muted/60 text-foreground"
      : "border-success/40 bg-success/10 text-foreground"
  );
  const badgeMainLabel = isOutstanding ? "Da incassare" : "Incassato";

  // Shared amount rendering
  const amountMain = isOutstanding ? formatEur(residuo) : formatEur(order.amount_cents);
  const amountSub = isOutstanding
    ? isPartial
      ? `Incassato ${formatEur(order.paid_amount_cents)} · Totale ${formatEur(order.amount_cents)}`
      : `Totale ${formatEur(order.amount_cents)}`
    : order.paid_at
      ? `Pagato il ${format(new Date(order.paid_at), "d MMM yyyy", { locale: it })}`
      : "Pagato";

  return (
    <>
      <div className="relative grid min-w-0 gap-3 px-4 py-4 md:px-6 md:py-4 md:grid-cols-[minmax(0,1fr)_140px_180px_170px] md:items-start md:gap-4 hover:bg-muted/30 transition-colors duration-150">
        {/* Column 1: Title / Client / Meta */}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{title}</p>
          <p className="text-sm text-muted-foreground truncate">{clientName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground leading-5">
            {isSingle ? (
              <>
                <span>
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
              <span>
                Venduto il {format(new Date(order.created_at), "d MMM yyyy", { locale: it })}
              </span>
            )}
          </div>
        </div>

        {/* Mobile: badge + amount side by side */}
        <div className="flex items-center justify-between md:hidden">
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={badgeMainClass}>
              {badgeMainLabel}
            </Badge>
            {isPartial && (
              <Badge variant="outline" className="h-6 rounded-full border border-warning/40 bg-warning/10 px-2 text-[10px] font-medium text-foreground">
                Parziale
              </Badge>
            )}
          </div>
          <div className="text-right tabular-nums">
            <p className="text-sm font-semibold text-foreground">{amountMain}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{amountSub}</p>
          </div>
        </div>

        {/* Column 2: Status badge (desktop only) */}
        <div className="hidden md:flex items-center gap-1.5 md:pt-[3px]">
          <Badge variant="outline" className={badgeMainClass}>
            {badgeMainLabel}
          </Badge>
          {isPartial && (
            <Badge variant="outline" className="h-6 rounded-full border border-warning/40 bg-warning/10 px-2 text-[10px] font-medium text-foreground">
              Parziale
            </Badge>
          )}
        </div>

        {/* Column 3: Amount (desktop only) */}
        <div className="hidden md:block text-right tabular-nums md:pt-[3px]">
          <p className="text-sm font-semibold text-foreground">{amountMain}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{amountSub}</p>
        </div>

        {/* Column 4: Action */}
        <div className="flex items-center justify-end pt-1 md:pt-[3px]">
          {isOutstanding ? (
            <Button
              variant="ghost"
              className="h-9 px-3 text-sm gap-1.5"
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
          ) : !isFree ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setResetAlertOpen(true)}>
                  Ripristina come da incassare
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
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
