import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePackage } from "../api/packages.api";
import { toast } from "sonner";
import { logClientActivity } from "@/features/clients/api/activities.api";

export function useUpdatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ packageId, input }: { packageId: string; input: any }) =>
      updatePackage(packageId, input),
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["package", data.package_id] });
      queryClient.invalidateQueries({ queryKey: ["packages", "client", data.client_id] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      
      // Log activity
      await logClientActivity(
        data.client_id,
        "PACKAGE_UPDATED",
        `Pacchetto "${data.name}" aggiornato`
      );
      
      toast.success("Pacchetto aggiornato");
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile aggiornare il pacchetto",
      });
    },
  });
}
