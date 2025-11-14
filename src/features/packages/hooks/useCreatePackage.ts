import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPackage } from "../api/packages.api";
import { toast } from "sonner";
import { logClientActivity } from "@/features/clients/api/activities.api";

export function useCreatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPackage,
    onSuccess: async (data) => {
      // Log activity
      await logClientActivity(
        data.client_id,
        "PACKAGE_CREATED",
        `Pacchetto creato: ${data.name} (${data.total_sessions} sessioni)`
      );

      queryClient.invalidateQueries({ queryKey: ["packages", "client", data.client_id] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success("Pacchetto creato correttamente");
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile creare il pacchetto",
      });
    },
  });
}
