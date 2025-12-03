import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignTemplateToClient } from "../api/client-plans.api";
import type { AssignTemplateInput } from "@/types/template";
import { toast } from "sonner";
import { logClientActivity } from "@/features/clients/api/activities.api";

export function useAssignTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, input }: { clientId: string; input: AssignTemplateInput }) =>
      assignTemplateToClient(clientId, input),
    onSuccess: async (plan, variables) => {
      // Log activity
      await logClientActivity(
        variables.clientId,
        "ASSIGNED_PLAN",
        `Piano assegnato: ${plan.name}`
      );

      queryClient.invalidateQueries({ queryKey: ["clientPlans", variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ["client", variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['client-onboarding-plans', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-plans-check'] });
      
      toast.success("Piano assegnato");
    },
  });
}
