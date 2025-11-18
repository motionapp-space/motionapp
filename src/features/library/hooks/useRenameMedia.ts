import { useMutation, useQueryClient } from "@tanstack/react-query";
import { renameMedia } from "../api/media.api";
import { toast } from "sonner";

export function useRenameMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newFilename }: { id: string; newFilename: string }) => 
      renameMedia(id, newFilename),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library-media"] });
      toast.success("File rinominato con successo");
    },
    onError: () => {
      toast.error("Errore durante la ridenominazione");
    },
  });
}
