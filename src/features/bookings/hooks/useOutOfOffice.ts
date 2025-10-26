import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listOutOfOfficeBlocks,
  createOutOfOfficeBlock,
  updateOutOfOfficeBlock,
  deleteOutOfOfficeBlock,
} from "../api/out-of-office.api";
import { toast } from "@/hooks/use-toast";
import type { CreateOutOfOfficeBlockInput, UpdateOutOfOfficeBlockInput } from "../types";

export function useOutOfOfficeBlocksQuery() {
  return useQuery({
    queryKey: ["out-of-office-blocks"],
    queryFn: listOutOfOfficeBlocks,
  });
}

export function useCreateOutOfOfficeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOutOfOfficeBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["out-of-office-blocks"] });
      toast({
        title: "Fuori ufficio aggiunto",
        description: "Il periodo fuori ufficio è stato aggiunto.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiungere il periodo fuori ufficio.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateOutOfOfficeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateOutOfOfficeBlockInput }) =>
      updateOutOfOfficeBlock(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["out-of-office-blocks"] });
      toast({
        title: "Fuori ufficio aggiornato",
        description: "Il periodo fuori ufficio è stato aggiornato.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare il periodo fuori ufficio.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteOutOfOfficeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOutOfOfficeBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["out-of-office-blocks"] });
      toast({
        title: "Fuori ufficio rimosso",
        description: "Il periodo fuori ufficio è stato rimosso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile rimuovere il periodo fuori ufficio.",
        variant: "destructive",
      });
    },
  });
}
