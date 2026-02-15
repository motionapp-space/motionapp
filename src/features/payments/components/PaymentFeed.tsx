import { useState, useMemo, useEffect } from "react";
import type { DateRange } from "react-day-picker";
import { Wallet } from "lucide-react";
import { PaymentFilters } from "./PaymentFilters";
import { PaymentFeedItem } from "./PaymentFeedItem";
import { useMarkOrderPaid } from "../hooks/useMarkOrderPaid";
import type { PaymentOrder, PaymentStatusFilter } from "../types";
import type { KpiFilter } from "@/pages/Payments";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const SKIP_STATUSES = new Set(["canceled", "refunded", "void"]);

function getResiduo(o: PaymentOrder) {
  return Math.max(0, o.amount_cents - o.paid_amount_cents);
}

function isDueNow(o: PaymentOrder): boolean {
  if (o.kind === "package_purchase") return true;
  if (o.kind === "single_lesson" && o.event_start_at != null) {
    return new Date(o.event_start_at) < new Date();
  }
  return false;
}

interface Props {
  orders: PaymentOrder[];
  kpiFilter?: KpiFilter;
  selectedMonth?: Date;
  onResetKpiFilter?: () => void;
}

export function PaymentFeed({ orders, kpiFilter, selectedMonth, onResetKpiFilter }: Props) {
  const [status, setStatus] = useState<PaymentStatusFilter>("outstanding");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [onlyDueNow, setOnlyDueNow] = useState(false);

  const markPaid = useMarkOrderPaid();

  // KPI-tab sync
  useEffect(() => {
    if (!kpiFilter) return;
    if (kpiFilter.type === "outstanding") {
      setStatus("outstanding");
      setOnlyDueNow(false);
    } else if (kpiFilter.type === "paidInMonth") {
      setStatus("paid");
      setOnlyDueNow(false);
    }
  }, [kpiFilter]);

  const handleStatusChange = (v: PaymentStatusFilter) => {
    setStatus(v);
    setOnlyDueNow(false);
    onResetKpiFilter?.();
  };

  // KPI chip label
  const kpiChipLabel = useMemo(() => {
    if (!kpiFilter) return undefined;
    if (kpiFilter.type === "outstanding") return "Da incassare";
    if (kpiFilter.type === "paidInMonth" && selectedMonth) {
      return `Pagati a ${format(selectedMonth, "MMM yyyy", { locale: it })}`;
    }
    return undefined;
  }, [kpiFilter, selectedMonth]);

  const filtered = useMemo(() => {
    let result = orders.filter((o) => !SKIP_STATUSES.has(o.status));

    // Tab filter
    if (status === "outstanding") {
      result = result.filter((o) => getResiduo(o) > 0);
    } else if (status === "paid") {
      result = result.filter((o) => {
        const res = getResiduo(o);
        // Include fully paid OR free orders (amount=0, paid=0)
        return (res <= 0 && o.paid_amount_cents > 0) || (o.amount_cents === 0 && res === 0);
      });
    }

    // KPI paidInMonth filter (applied on top of tab "paid")
    if (kpiFilter?.type === "paidInMonth" && selectedMonth) {
      const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59, 999);
      result = result.filter((o) => {
        if (!o.paid_at) return false;
        const d = new Date(o.paid_at);
        return d >= monthStart && d <= monthEnd;
      });
    }

    // Toggle "Solo già dovuti"
    if (onlyDueNow && status === "outstanding") {
      result = result.filter((o) => isDueNow(o));
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) => `${o.client_first_name} ${o.client_last_name}`.toLowerCase().includes(q)
      );
    }

    // Date range
    if (dateRange?.from) {
      const from = dateRange.from;
      const to = dateRange.to ?? dateRange.from;
      result = result.filter((o) => {
        const d = new Date(o.created_at);
        return d >= from && d <= new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59);
      });
    }

    // Sorting
    result = [...result].sort((a, b) => {
      if (status === "outstanding") {
        const aDue = isDueNow(a) ? 0 : 1;
        const bDue = isDueNow(b) ? 0 : 1;
        if (aDue !== bDue) return aDue - bDue;
        const resA = getResiduo(a);
        const resB = getResiduo(b);
        if (resA !== resB) return resB - resA;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (status === "paid") {
        const pA = a.paid_at ? new Date(a.paid_at).getTime() : 0;
        const pB = b.paid_at ? new Date(b.paid_at).getTime() : 0;
        if (pA !== pB) return pB - pA;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [orders, status, search, dateRange, kpiFilter, selectedMonth, onlyDueNow]);

  return (
    <div className="space-y-4">
      <PaymentFilters
        status={status}
        onStatusChange={handleStatusChange}
        search={search}
        onSearchChange={setSearch}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onlyDueNow={onlyDueNow}
        onOnlyDueNowChange={setOnlyDueNow}
        kpiChipLabel={kpiChipLabel}
        onRemoveKpiChip={onResetKpiFilter}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-base font-semibold">Nessun pagamento trovato</p>
          <p className="text-sm text-muted-foreground mt-1">
            Prova a modificare i filtri per visualizzare altri risultati.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((order) => (
            <PaymentFeedItem
              key={order.id}
              order={order}
              onMarkPaid={(id) => markPaid.mutate(id)}
              isPending={markPaid.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
