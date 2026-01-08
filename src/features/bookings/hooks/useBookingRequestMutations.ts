import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  approveBookingRequest,
  declineBookingRequest,
  counterProposeBookingRequest,
} from "../api/booking-requests.api";
import type { BookingRequestWithClient } from "../types";

/**
 * Approve booking request with optimistic update
 */
export function useApproveBookingRequestOptimistic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveBookingRequest,
    onMutate: async (requestId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["booking-requests"] });

      // Snapshot previous value
      const previousPending = queryClient.getQueryData<BookingRequestWithClient[]>([
        "booking-requests",
        { status: "PENDING" },
      ]);

      // Optimistically remove from PENDING list
      queryClient.setQueryData<BookingRequestWithClient[]>(
        ["booking-requests", { status: "PENDING" }],
        (old) => old?.filter((r) => r.id !== requestId) ?? []
      );

      return { previousPending };
    },
    onError: (error, _requestId, context) => {
      // Rollback on error
      if (context?.previousPending) {
        queryClient.setQueryData(
          ["booking-requests", { status: "PENDING" }],
          context.previousPending
        );
      }
      toast.error("Errore", {
        description: error instanceof Error ? error.message : "Errore sconosciuto",
      });
    },
    onSuccess: () => {
      toast.success("Appuntamento confermato");
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onSettled: () => {
      // Always re-sync after operation
      queryClient.invalidateQueries({ queryKey: ["booking-requests"] });
    },
  });
}

/**
 * Decline booking request with optimistic update
 */
export function useDeclineBookingRequestOptimistic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: declineBookingRequest,
    onMutate: async (requestId: string) => {
      await queryClient.cancelQueries({ queryKey: ["booking-requests"] });

      const previousPending = queryClient.getQueryData<BookingRequestWithClient[]>([
        "booking-requests",
        { status: "PENDING" },
      ]);

      queryClient.setQueryData<BookingRequestWithClient[]>(
        ["booking-requests", { status: "PENDING" }],
        (old) => old?.filter((r) => r.id !== requestId) ?? []
      );

      return { previousPending };
    },
    onError: (error, _requestId, context) => {
      if (context?.previousPending) {
        queryClient.setQueryData(
          ["booking-requests", { status: "PENDING" }],
          context.previousPending
        );
      }
      toast.error("Errore", {
        description: error instanceof Error ? error.message : "Errore sconosciuto",
      });
    },
    onSuccess: () => {
      toast.success("Richiesta rifiutata");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-requests"] });
    },
  });
}

/**
 * Counter-propose booking request with optimistic update
 */
export function useCounterProposeBookingRequestOptimistic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      startAt,
      endAt,
    }: {
      requestId: string;
      startAt: string;
      endAt: string;
    }) => counterProposeBookingRequest(requestId, startAt, endAt),
    onMutate: async ({ requestId }) => {
      await queryClient.cancelQueries({ queryKey: ["booking-requests"] });

      const previousPending = queryClient.getQueryData<BookingRequestWithClient[]>([
        "booking-requests",
        { status: "PENDING" },
      ]);

      const previousCounterProposed = queryClient.getQueryData<BookingRequestWithClient[]>([
        "booking-requests",
        { status: "COUNTER_PROPOSED" },
      ]);

      // Find the request being moved
      const request = previousPending?.find((r) => r.id === requestId);

      // Remove from PENDING
      queryClient.setQueryData<BookingRequestWithClient[]>(
        ["booking-requests", { status: "PENDING" }],
        (old) => old?.filter((r) => r.id !== requestId) ?? []
      );

      // Add to COUNTER_PROPOSED (if we have the request data)
      if (request) {
        queryClient.setQueryData<BookingRequestWithClient[]>(
          ["booking-requests", { status: "COUNTER_PROPOSED" }],
          (old) => [
            ...(old ?? []),
            { ...request, status: "COUNTER_PROPOSED" as const },
          ]
        );
      }

      return { previousPending, previousCounterProposed };
    },
    onError: (error, _vars, context) => {
      if (context?.previousPending) {
        queryClient.setQueryData(
          ["booking-requests", { status: "PENDING" }],
          context.previousPending
        );
      }
      if (context?.previousCounterProposed) {
        queryClient.setQueryData(
          ["booking-requests", { status: "COUNTER_PROPOSED" }],
          context.previousCounterProposed
        );
      }
      toast.error("Errore", {
        description: error instanceof Error ? error.message : "Errore sconosciuto",
      });
    },
    onSuccess: () => {
      toast.success("Proposta inviata al cliente");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-requests"] });
    },
  });
}
