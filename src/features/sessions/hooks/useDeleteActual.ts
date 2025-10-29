import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteActual } from "../api/actuals.api";

export function useDeleteActual(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteActual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actuals", sessionId] });
    },
  });
}
