import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createActual } from "../api/actuals.api";

export function useCreateActual(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: any) => createActual(sessionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actuals", sessionId] });
    },
  });
}
