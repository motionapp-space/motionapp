import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignTemplateToClient } from "../api/client-plans.api";
import type { AssignTemplateInput } from "@/types/template";

export function useAssignTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, input }: { clientId: string; input: AssignTemplateInput }) =>
      assignTemplateToClient(clientId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientPlans", variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ["client", variables.clientId] });
    },
  });
}
