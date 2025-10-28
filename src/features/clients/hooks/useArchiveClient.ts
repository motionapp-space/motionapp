import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveClient } from "../api/client-fsm.api";
import { toast } from "sonner";

export function useArchiveClient() {
  const qc = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (clientId: string) => archiveClient(clientId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente archiviato con successo");
    },
    onError: (error) => {
      toast.error(`Errore durante l'archiviazione: ${error.message}`);
    },
  });
}
