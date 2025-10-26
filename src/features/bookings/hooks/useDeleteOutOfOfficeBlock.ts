import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteOutOfOfficeBlock } from "../api/out-of-office.api";
import { toast } from "@/hooks/use-toast";

export function useDeleteOutOfOfficeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOutOfOfficeBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["out-of-office-blocks"] });
      toast({
        title: "Periodo di assenza eliminato",
        description: "Il periodo di assenza è stato eliminato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare il periodo di assenza.",
        variant: "destructive",
      });
    },
  });
}
