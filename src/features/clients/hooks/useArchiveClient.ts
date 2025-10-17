import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveClient } from "../api/clients.api";
import { toast } from "sonner";

export function useArchiveClient() {
  const qc = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: archiveClient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente archiviato con successo");
    },
    onError: (error) => {
      toast.error(`Errore durante l'archiviazione: ${error.message}`);
    },
  });
}
