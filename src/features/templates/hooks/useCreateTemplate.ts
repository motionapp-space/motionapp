import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTemplate } from "../api/templates.api";
import type { CreateTemplateInput } from "@/types/template";

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTemplateInput) => createTemplate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}
