import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPackage } from "../api/packages.api";
import { toast } from "sonner";

export function useCreatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPackage,
    onSuccess: (data) => {
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
