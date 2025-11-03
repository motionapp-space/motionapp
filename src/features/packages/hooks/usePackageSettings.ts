import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPackageSettings, updatePackageSettings } from "../api/packages.api";
import { toast } from "sonner";

export function usePackageSettings() {
  return useQuery({
    queryKey: ["package-settings"],
    queryFn: getPackageSettings,
  });
}

export function useUpdatePackageSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePackageSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package-settings"] });
      toast.success("Impostazioni aggiornate");
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile aggiornare le impostazioni",
      });
    },
  });
}
