import { Calendar, Package, Check } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PaymentOrder } from "../types";

function formatEur(cents: number) {
  return (cents / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

function statusBadge(status: string) {
  switch (status) {
    case "due":
      return <Badge variant="destructive">Non Pagato</Badge>;
    case "draft":
      return <Badge variant="outline" className="border-amber-400 text-amber-600">In Attesa</Badge>;
    case "paid":
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Pagato</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

interface Props {
  order: PaymentOrder;
  onMarkPaid: (id: string) => void;
  isPending: boolean;
}

export function PaymentFeedItem({ order, onMarkPaid, isPending }: Props) {
  const isSingle = order.kind === "single_lesson";
  const Icon = isSingle ? Calendar : Package;

  const label = isSingle
    ? `Lezione del ${order.event_start_at ? format(new Date(order.event_start_at), "d MMM yyyy", { locale: it }) : "—"} – ${order.client_first_name} ${order.client_last_name}`
    : `Pacchetto ${order.package_name ?? "—"} – ${order.client_first_name} ${order.client_last_name}`;

  return (
    <div className="group flex items-center gap-4 rounded-2xl border bg-card px-4 py-3.5 transition-all hover:shadow-sm hover:border-primary/20">
      <div className="rounded-full bg-muted p-2 shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {format(new Date(order.created_at), "d MMM yyyy", { locale: it })}
        </p>
      </div>

      <p className="text-sm font-semibold shrink-0">{formatEur(order.amount_cents)}</p>

      <div className="shrink-0">{statusBadge(order.status)}</div>

      {order.status !== "paid" && (
        <Button
          size="sm"
          variant="ghost"
          className="shrink-0 text-xs gap-1"
          disabled={isPending}
          onClick={() => onMarkPaid(order.id)}
        >
          <Check className="h-3.5 w-3.5" />
          Pagato
        </Button>
      )}
    </div>
  );
}
