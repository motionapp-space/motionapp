import { useTopbar } from "@/contexts/TopbarContext";
import { TabHeader } from "@/components/ui/tab-header";
import { Skeleton } from "@/components/ui/skeleton";
import { usePayments } from "@/features/payments/hooks/usePayments";
import { usePaymentKPIs } from "@/features/payments/hooks/usePaymentKPIs";
import { PaymentKPICards } from "@/features/payments/components/PaymentKPICards";
import { PaymentFeed } from "@/features/payments/components/PaymentFeed";

export default function Payments() {
  useTopbar({ title: "Pagamenti" });

  const { data: orders, isLoading } = usePayments();
  const kpis = usePaymentKPIs(orders);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6">
      <TabHeader
        title="Pagamenti"
        subtitle="Gestisci i pagamenti dei tuoi clienti"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <PaymentKPICards
            totalDue={kpis.totalDue}
            paidThisMonth={kpis.paidThisMonth}
            draftCount={kpis.draftCount}
          />
          <PaymentFeed orders={orders ?? []} />
        </>
      )}
    </div>
  );
}
