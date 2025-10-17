import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveClientPlanAsTemplate } from "../api/client-plans.api";
import type { SaveAsTemplateInput } from "@/types/template";

export function useSaveAsTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, input }: { planId: string; input: SaveAsTemplateInput }) =>
      saveClientPlanAsTemplate(planId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}
