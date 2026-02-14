import { useMemo } from "react";
import type { PaymentOrder } from "../types";

export function usePaymentKPIs(orders: PaymentOrder[] | undefined) {
  return useMemo(() => {
    if (!orders) return { totalDue: 0, paidThisMonth: 0, draftCount: 0 };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalDue = 0;
    let paidThisMonth = 0;
    let draftCount = 0;

    for (const o of orders) {
      if (o.status === "due") {
        totalDue += o.amount_cents;
      }
      if (o.status === "paid" && o.paid_at && new Date(o.paid_at) >= startOfMonth) {
        paidThisMonth += o.amount_cents;
      }
      if (o.status === "draft") {
        draftCount++;
      }
    }

    return { totalDue, paidThisMonth, draftCount };
  }, [orders]);
}
