import { useMutation, useQueryClient } from "@tanstack/react-query";
import { duplicateTemplate } from "../api/templates.api";

export function useDuplicateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => duplicateTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}
