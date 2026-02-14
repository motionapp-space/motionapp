import { useQuery } from "@tanstack/react-query";
import { fetchPaymentOrders } from "../api/payments.api";

export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: fetchPaymentOrders,
  });
}
