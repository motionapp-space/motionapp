import { useMemo } from "react";
import type { PaymentOrder } from "../types";

const SKIP_STATUSES = new Set(["canceled", "refunded", "void"]);

export interface PaymentKPIs {
  daIncassareTotale: number;
  parteCerta: number;
  parteNonCerta: number;
  incassatoMese: number;
}

export function usePaymentKPIs(
  orders: PaymentOrder[] | undefined,
  selectedMonth: Date
): PaymentKPIs {
  return useMemo(() => {
    const result: PaymentKPIs = {
      daIncassareTotale: 0,
      parteCerta: 0,
      parteNonCerta: 0,
      incassatoMese: 0,
    };

    if (!orders) return result;

    const now = new Date();
    const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    for (const o of orders) {
      // Hard guard: skip canceled/refunded/void
      if (SKIP_STATUSES.has(o.status)) continue;

      const residuo = o.amount_cents - o.paid_amount_cents;

      // Da incassare breakdown
      if (residuo > 0) {
        if (o.kind === "package_purchase") {
          result.parteCerta += residuo;
        } else if (o.kind === "single_lesson") {
          if (o.event_start_at != null && new Date(o.event_start_at) < now) {
            result.parteCerta += residuo;
          } else {
            // future lesson or null event_start_at (anomaly) → non certa
            result.parteNonCerta += residuo;
          }
        }
      }

      // Incassato mese: based on paid_at within selectedMonth
      if (o.paid_at && o.paid_amount_cents > 0) {
        const paidDate = new Date(o.paid_at);
        if (paidDate >= monthStart && paidDate <= monthEnd) {
          result.incassatoMese += o.paid_amount_cents;
        }
      }
    }

    result.daIncassareTotale = result.parteCerta + result.parteNonCerta;

    return result;
  }, [orders, selectedMonth]);
}
