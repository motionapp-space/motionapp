import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../api/clients.api";
import { createInvite } from "../api/invites.api";
import { logClientActivity } from "../api/activities.api";
import type { CreateClientInput, CreateClientResult, Client } from "../types";
import { toast } from "sonner";

export function useCreateClient() {
  const qc = useQueryClient();

  return useMutation<CreateClientResult, Error, CreateClientInput>({
    mutationFn: async (input) => {
      // 1. Create the client
      const client = await createClient(input);
      
      // 2. If withInvite is true and email exists, create invite
      let invite: CreateClientResult["invite"] = undefined;
      if (input.withInvite && input.email) {
        const inviteResult = await createInvite(client.id);
        if (inviteResult.success && inviteResult.inviteLink) {
          invite = {
            inviteLink: inviteResult.inviteLink,
            expiresAt: inviteResult.expiresAt!,
            email: inviteResult.email!,
            clientName: inviteResult.clientName!,
            emailSent: inviteResult.emailSent ?? false,
            emailError: inviteResult.emailError,
          };
        } else if (!inviteResult.success) {
          // Log error but don't fail the whole operation
          console.error("Failed to create invite:", inviteResult.error);
          toast.warning("Cliente creato, ma errore nella creazione del link di invito");
        }
      }
      
      return { client, invite };
    },
    onSuccess: async (result) => {
      const { client } = result;
      
      // Log activity
      await logClientActivity(
        client.id,
        "CREATED",
        `Cliente creato: ${client.first_name} ${client.last_name}`
      );

      // Delay cache invalidation to allow navigation to complete first
      // This prevents re-render from interfering with navigate()
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["clients"] });
      }, 100);
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
      // Coach-client status constraint (es. 'invited' non era nel check)
      else if (error.message.includes('coach_clients_status_check')) {
        toast.error("Errore di stato relazione", {
          description: "Stato non valido per la relazione coach-cliente. Contatta il supporto."
        });
      }
      // Invalid email format / check constraint (specifico per email)
      else if (error.message.includes('check_valid_email') || 
               error.message.includes('check_valid_invite_email')) {
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
