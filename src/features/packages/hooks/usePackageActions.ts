import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  archivePackage, 
  togglePackageSuspension
} from "../api/packages.api";
import { toast } from "sonner";
import { logClientActivity } from "@/features/clients/api/activities.api";
import { getCoachClientDetails } from "@/lib/coach-client";
import { invalidateDashboardQueries } from "@/features/dashboard/lib/invalidateDashboardQueries";
import { dashboardQueryKeys } from "@/features/dashboard/lib/dashboardQueryKeys";

export function useArchivePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archivePackage,
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["package", data.package_id] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      
      // Get client_id from coach_client relationship for activity logging
      const details = await getCoachClientDetails(data.coach_client_id);
      
      // Log activity
      await logClientActivity(
        details.client_id,
        "PACKAGE_UPDATED",
        `Pacchetto "${data.name}" archiviato`
      );
      
      toast.success("Pacchetto archiviato");
      await invalidateDashboardQueries(queryClient, [
        dashboardQueryKeys.clientsLowSessions(),
      ]);
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message,
      });
    },
  });
}

export function useToggleSuspension() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: togglePackageSuspension,
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["package", data.package_id] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      
      const action = data.usage_status === 'suspended' ? 'sospeso' : 'riattivato';
      
      // Get client_id from coach_client relationship for activity logging
      const details = await getCoachClientDetails(data.coach_client_id);
      
      // Log activity
      await logClientActivity(
        details.client_id,
        "PACKAGE_UPDATED",
        `Pacchetto "${data.name}" ${action}`
      );
      
      toast.success(`Pacchetto ${action}`);
      await invalidateDashboardQueries(queryClient, [
        dashboardQueryKeys.clientsLowSessions(),
      ]);
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message,
      });
    },
  });
}
