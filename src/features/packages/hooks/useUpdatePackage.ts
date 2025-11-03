import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePackage } from "../api/packages.api";
import { toast } from "sonner";

export function useUpdatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ packageId, input }: { packageId: string; input: any }) =>
      updatePackage(packageId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["package", data.package_id] });
      queryClient.invalidateQueries({ queryKey: ["packages", "client", data.client_id] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success("Pacchetto aggiornato");
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile aggiornare il pacchetto",
      });
    },
  });
}
