import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { invalidateDashboardQueries } from "@/features/dashboard/lib/invalidateDashboardQueries";
import { dashboardQueryKeys } from "@/features/dashboard/lib/dashboardQueryKeys";

export function useRegisterPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      amountCents,
    }: {
      orderId: string;
      amountCents: number;
    }) => {
      const { data, error } = await supabase.rpc("register_order_payment", {
        p_order_id: orderId,
        p_amount_cents: amountCents,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Pagamento registrato");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Errore nel registrare il pagamento");
    },
  });
}
