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
      navigate(`/?from=create&highlight=${created.id}&sort=updated_desc&page=1`);
      
      toast.success("Cliente creato con successo");
    },
    onError: (error) => {
      console.error("Create client error:", error);
      
      // Duplicate email constraint violation
      if (error.message.includes('uq_client_email') || error.message.includes('duplicate key')) {
        toast.error("Email già utilizzata", {
          description: "Questa email è già associata a un altro cliente. Inserisci un indirizzo diverso."
        });
      } 
      // Invalid email format / check constraint
      else if (error.message.includes('check_valid_email') || error.message.includes('invalid') || error.message.includes('violates check constraint')) {
        toast.error("Email non valida", {
          description: "Inserisci un indirizzo email valido (es. nome@dominio.com)"
        });
      }
      // Generic error
      else {
        toast.error("Errore durante la creazione", {
          description: error.message
        });
      }
    },
  });
}
