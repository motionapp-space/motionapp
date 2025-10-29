import { useQuery } from "@tanstack/react-query";
import { getExerciseHistory } from "../api/actuals.api";

export function useExerciseHistory(clientId: string | undefined, exerciseId: string | undefined, limit = 10) {
  return useQuery({
    queryKey: ["exercise-history", clientId, exerciseId, limit],
    queryFn: () => getExerciseHistory(clientId!, exerciseId!, limit),
    enabled: !!clientId && !!exerciseId,
  });
}
