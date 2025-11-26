import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unarchiveClient } from "../api/client-fsm.api";
import { toast } from "sonner";

export function useUnarchiveClient() {
  const qc = useQueryClient();

  return useMutation<any, Error, string>({
    mutationFn: (clientId: string) => unarchiveClient(clientId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["onboarding-archived-check"] });
      qc.invalidateQueries({ queryKey: ["onboarding-non-archived-count"] });
      toast.success("Cliente ripristinato con successo");
    },
    onError: (error) => {
      toast.error(`Errore durante il ripristino: ${error.message}`);
    },
  });
}
