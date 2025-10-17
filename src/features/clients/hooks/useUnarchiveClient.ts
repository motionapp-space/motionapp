import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unarchiveClient } from "../api/clients.api";
import { toast } from "sonner";
import type { Client } from "../types";

export function useUnarchiveClient() {
  const qc = useQueryClient();

  return useMutation<Client, Error, string>({
    mutationFn: unarchiveClient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente ripristinato con successo");
    },
    onError: (error) => {
      toast.error(`Errore durante il ripristino: ${error.message}`);
    },
  });
}
