import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  archivePackage, 
  togglePackageSuspension
} from "../api/packages.api";
import { toast } from "sonner";
import { logClientActivity } from "@/features/clients/api/activities.api";

export function useArchivePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archivePackage,
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["package", data.package_id] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      
      // Log activity
      await logClientActivity(
        data.client_id,
        "PACKAGE_UPDATED",
        `Pacchetto "${data.name}" archiviato`
      );
      
      toast.success("Pacchetto archiviato");
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
      
      // Log activity
      await logClientActivity(
        data.client_id,
        "PACKAGE_UPDATED",
        `Pacchetto "${data.name}" ${action}`
      );
      
      toast.success(`Pacchetto ${action}`);
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message,
      });
    },
  });
}

