import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOutOfOfficeBlock } from "../api/out-of-office.api";
import { toast } from "@/hooks/use-toast";
import type { CreateOutOfOfficeBlockInput } from "../types";

export function useCreateOutOfOfficeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOutOfOfficeBlockInput) => createOutOfOfficeBlock(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["out-of-office-blocks"] });
      toast({
        title: "Periodo di assenza creato",
        description: "Il periodo di assenza è stato creato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare il periodo di assenza.",
        variant: "destructive",
      });
    },
  });
}
