import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateClient } from "../api/clients.api";
import type { UpdateClientInput, Client } from "../types";
import { toast } from "sonner";

export function useUpdateClient(clientId: string) {
  const qc = useQueryClient();

  return useMutation<Client, Error, UpdateClientInput>({
    mutationFn: (input) => updateClient(clientId, input),
    onSuccess: (updated) => {
      // Update ottimistico del detail
      qc.setQueryData(["client", clientId], (old: Client | undefined) =>
        old ? { ...old, ...updated } : updated
      );
      // Invalida liste clienti
      qc.invalidateQueries({ queryKey: ["clients"], exact: false });
      toast.success("Cliente aggiornato con successo");
    },
    onError: (error) => {
      toast.error(`Errore durante l'aggiornamento: ${error.message}`);
    },
  });
}
