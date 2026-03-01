import { useQuery } from "@tanstack/react-query";
import { fetchAllFeedback } from "../api/feedback.api";

export function useAdminFeedback() {
  return useQuery({
    queryKey: ["admin", "feedback"],
    queryFn: fetchAllFeedback,
    staleTime: 2 * 60 * 1000,
  });
}
