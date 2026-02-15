import { useState, useMemo } from "react";
import type { DateRange } from "react-day-picker";
import { Wallet } from "lucide-react";
import { PaymentFilters } from "./PaymentFilters";
import { PaymentFeedItem } from "./PaymentFeedItem";
import { useMarkOrderPaid } from "../hooks/useMarkOrderPaid";
import type { PaymentOrder, PaymentStatusFilter } from "../types";
import type { KpiFilter } from "@/pages/Payments";

interface Props {
  orders: PaymentOrder[];
  kpiFilter?: KpiFilter;
  selectedMonth?: Date;
}

export function PaymentFeed({ orders, kpiFilter, selectedMonth }: Props) {
  const [status, setStatus] = useState<PaymentStatusFilter>("due");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const markPaid = useMarkOrderPaid();

  const filtered = useMemo(() => {
    let result = orders;

    // KPI filter takes priority when active
    if (kpiFilter?.type === "outstanding") {
      result = result.filter((o) => o.amount_cents - o.paid_amount_cents > 0);
    } else if (kpiFilter?.type === "paidInMonth" && selectedMonth) {
      const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59, 999);
      result = result.filter((o) => {
        if (!o.paid_at || o.paid_amount_cents <= 0) return false;
        const d = new Date(o.paid_at);
        return d >= monthStart && d <= monthEnd;
      });
    } else {
      // Normal status filter
      if (status !== "all") {
        result = result.filter((o) => o.status === status);
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          `${o.client_first_name} ${o.client_last_name}`.toLowerCase().includes(q)
      );
    }

    if (dateRange?.from) {
      const from = dateRange.from;
      const to = dateRange.to ?? dateRange.from;
      result = result.filter((o) => {
        const d = new Date(o.created_at);
        return d >= from && d <= new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59);
      });
    }

    return result;
  }, [orders, status, search, dateRange, kpiFilter, selectedMonth]);

  return (
    <div className="space-y-4">
      <PaymentFilters
        status={status}
        onStatusChange={setStatus}
        search={search}
        onSearchChange={setSearch}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
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
        <div className="space-y-2">
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
