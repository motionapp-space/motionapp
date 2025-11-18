import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadMedia } from "../api/media.api";

export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library-media"] });
    },
  });
}
