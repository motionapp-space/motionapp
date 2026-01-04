import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateClientPlan } from "../api/client-plans.api";
import type { ClientPlan } from "@/types/template";

export function useUpdateClientPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ClientPlan> }) =>
      updateClientPlan(id, updates),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["clientPlans"] });
      queryClient.invalidateQueries({ queryKey: ["clientPlan", data.id] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-plans-check'] });
    },
  });
}
