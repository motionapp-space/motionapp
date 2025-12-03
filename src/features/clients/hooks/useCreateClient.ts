import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createClient } from "../api/clients.api";
import { logClientActivity } from "../api/activities.api";
import type { CreateClientInput, Client } from "../types";
import { toast } from "sonner";

export function useCreateClient() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation<Client, Error, CreateClientInput>({
    mutationFn: createClient,
    onSuccess: async (created) => {
      // Log activity
      await logClientActivity(
        created.id,
        "CREATED",
        `Cliente creato: ${created.first_name} ${created.last_name}`
      );

      // Invalidate all client list queries
      qc.invalidateQueries({ queryKey: ["clients"] });
      
      // Redirect to client detail page
      navigate(`/clients/${created.id}`);
      
      toast.success("Cliente creato con successo");
    },
    onError: (error) => {
      console.error("Create client error:", error);
      
      // Duplicate fiscal code (più specifico, va PRIMA)
      if (error.message.includes('idx_clients_fiscal_code_unique') || 
          (error.message.includes('duplicate key') && error.message.includes('fiscal_code'))) {
        toast.error("Codice fiscale già utilizzato", {
          description: "Questo codice fiscale è già associato a un altro cliente. Inserisci un codice diverso."
        });
      }
      // Duplicate email constraint
      else if (error.message.includes('uq_client_email') || 
               (error.message.includes('duplicate key') && error.message.includes('email'))) {
        toast.error("Email già utilizzata", {
          description: "Questa email è già associata a un altro cliente. Inserisci un indirizzo diverso."
        });
      } 
      // Invalid email format / check constraint
      else if (error.message.includes('check_valid_email') || 
               error.message.includes('invalid') || 
               error.message.includes('violates check constraint')) {
        toast.error("Email non valida", {
          description: "Inserisci un indirizzo email valido (es. nome@dominio.com)"
        });
      }
      // Generic duplicate key error (fallback)
      else if (error.message.includes('duplicate key')) {
        toast.error("Valore duplicato", {
          description: "Uno dei valori inseriti è già presente nel sistema."
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
