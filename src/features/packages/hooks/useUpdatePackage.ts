import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePackage } from "../api/packages.api";
import { toast } from "sonner";
import { logClientActivity } from "@/features/clients/api/activities.api";
import { getCoachClientDetails } from "@/lib/coach-client";
import { invalidateDashboardQueries } from "@/features/dashboard/lib/invalidateDashboardQueries";
import { dashboardQueryKeys } from "@/features/dashboard/lib/dashboardQueryKeys";

export function useUpdatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ packageId, input }: { packageId: string; input: any }) =>
      updatePackage(packageId, input),
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["package", data.package_id] });
      queryClient.invalidateQueries({ queryKey: ["packages", "coach-client", data.coach_client_id] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      
      // Get client_id from coach_client relationship for activity logging
      const details = await getCoachClientDetails(data.coach_client_id);
      
      // Log activity
      await logClientActivity(
        details.client_id,
        "PACKAGE_UPDATED",
        `Pacchetto "${data.name}" aggiornato`
      );
      
      toast.success("Pacchetto aggiornato");
      await invalidateDashboardQueries(queryClient, [
        dashboardQueryKeys.clientsLowSessions(),
      ]);
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile aggiornare il pacchetto",
      });
    },
  });
}
