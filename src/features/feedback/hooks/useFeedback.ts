import { useMutation } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { createFeedback, FeedbackType } from "../api/feedback.api";

interface SendFeedbackParams {
  type: FeedbackType;
  section: string;
  message: string;
}

export function useFeedback() {
  const location = useLocation();

  const mutation = useMutation({
    mutationFn: async (params: SendFeedbackParams) => {
      return createFeedback({
        type: params.type,
        section: params.section,
        message: params.message,
        page: location.pathname,
      });
    },
  });

  return {
    sendFeedback: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
