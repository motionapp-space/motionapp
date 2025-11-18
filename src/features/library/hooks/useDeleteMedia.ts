import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMedia } from "../api/media.api";

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library-media"] });
    },
  });
}
