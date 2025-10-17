import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateClient } from "../api/clients.api";
import type { UpdateClientInput, Client } from "../types";
import { toast } from "sonner";

export function useUpdateClient(clientId: string) {
  const qc = useQueryClient();

  return useMutation<Client, Error, UpdateClientInput>({
    mutationFn: (input) => updateClient(clientId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["client", clientId] });
      toast.success("Cliente aggiornato con successo");
    },
    onError: (error) => {
      toast.error(`Errore durante l'aggiornamento: ${error.message}`);
    },
  });
}
