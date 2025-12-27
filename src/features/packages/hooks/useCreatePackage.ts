import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPackage } from "../api/packages.api";
import { toast } from "sonner";
import { logClientActivity } from "@/features/clients/api/activities.api";
import { getCoachClientDetails } from "@/lib/coach-client";

export function useCreatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPackage,
    onSuccess: async (data) => {
      // Get client_id from coach_client relationship for activity logging
      const details = await getCoachClientDetails(data.coach_client_id);
      
      // Log activity
      await logClientActivity(
        details.client_id,
        "PACKAGE_CREATED",
        `Pacchetto creato: ${data.name} (${data.total_sessions} sessioni)`
      );

      queryClient.invalidateQueries({ queryKey: ["packages", "client"] });
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
