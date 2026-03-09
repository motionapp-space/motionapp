import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { invalidateDashboardQueries } from "@/features/dashboard/lib/invalidateDashboardQueries";
import { dashboardQueryKeys } from "@/features/dashboard/lib/dashboardQueryKeys";

export function useMarkOrderPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc("mark_order_as_paid", {
        p_order_id: orderId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Pagamento registrato");
      await invalidateDashboardQueries(queryClient, [
        dashboardQueryKeys.pendingActions(),
        dashboardQueryKeys.revenueTrend(),
        dashboardQueryKeys.stats(),
      ]);
    },
    onError: () => {
      toast.error("Errore nel registrare il pagamento");
    },
  });
}
