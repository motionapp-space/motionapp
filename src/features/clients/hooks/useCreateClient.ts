import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createClient } from "../api/clients.api";
import type { CreateClientInput, Client } from "../types";
import { toast } from "sonner";

export function useCreateClient() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation<Client, Error, CreateClientInput>({
    mutationFn: createClient,
    onSuccess: (created) => {
      // Invalidate all client list queries
      qc.invalidateQueries({ queryKey: ["clients"] });
      
      // Redirect to list with deterministic state and highlight
      navigate(`/clients?from=create&highlight=${created.id}&sort=updated_desc&page=1`);
      
      toast.success("Cliente creato con successo");
    },
    onError: (error) => {
      toast.error(`Errore durante la creazione: ${error.message}`);
    },
  });
}
