import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTemplate } from "../api/templates.api";
import type { UpdateTemplateInput } from "@/types/template";

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTemplateInput }) =>
      updateTemplate(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["template", variables.id] });
    },
  });
}
