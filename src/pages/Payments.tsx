import { useState, useCallback } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useTopbar } from "@/contexts/TopbarContext";
import { TabHeader } from "@/components/ui/tab-header";
import { Skeleton } from "@/components/ui/skeleton";
import { usePayments } from "@/features/payments/hooks/usePayments";
import { usePaymentKPIs } from "@/features/payments/hooks/usePaymentKPIs";
import { PaymentKPICards } from "@/features/payments/components/PaymentKPICards";
import { PaymentFeed } from "@/features/payments/components/PaymentFeed";
import { MonthSelector } from "@/features/payments/components/MonthSelector";

export type KpiFilter =
  | { type: "outstanding" }
  | null;

export default function Payments() {
  useTopbar({ title: "Pagamenti" });

  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const { data: orders, isLoading } = usePayments();
  const kpis = usePaymentKPIs(orders, selectedMonth);

  const [kpiFilter, setKpiFilter] = useState<KpiFilter>(null);

  const monthLabel = format(selectedMonth, "MMM yyyy", { locale: it });

  const handleFilterOutstanding = useCallback(() => {
    setKpiFilter((prev) =>
      prev?.type === "outstanding" ? null : { type: "outstanding" }
    );
  }, []);

  const handleResetKpiFilter = useCallback(() => setKpiFilter(null), []);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6">
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-2xl sm:col-span-2" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : (
        <>
          <PaymentKPICards
            kpis={kpis}
            monthLabel={monthLabel}
            onFilterOutstanding={handleFilterOutstanding}
            isOutstandingActive={kpiFilter?.type === "outstanding"}
            monthSelector={
              <MonthSelector
                value={selectedMonth}
                onChange={setSelectedMonth}
              />
            }
          />
          <PaymentFeed
            orders={orders ?? []}
            kpiFilter={kpiFilter}
            onResetKpiFilter={handleResetKpiFilter}
          />
        </>
      )}
    </div>
  );
}
