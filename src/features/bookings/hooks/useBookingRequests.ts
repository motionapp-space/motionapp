import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listBookingRequests,
  getBookingRequestById,
  approveBookingRequest,
  declineBookingRequest,
  counterProposeBookingRequest,
  deleteBookingRequest,
} from "../api/booking-requests.api";
import { toast } from "@/hooks/use-toast";
import type { BookingRequestStatus } from "../types";
import { invalidateDashboardQueries } from "@/features/dashboard/lib/invalidateDashboardQueries";
import { dashboardQueryKeys } from "@/features/dashboard/lib/dashboardQueryKeys";

export function useBookingRequestsQuery(filters?: { status?: BookingRequestStatus }) {
  return useQuery({
    queryKey: ["booking-requests", filters],
    queryFn: async () => listBookingRequests(filters),
  });
}

export function useBookingRequestQuery(id: string) {
  return useQuery({
    queryKey: ["booking-request", id],
    queryFn: () => getBookingRequestById(id),
    enabled: !!id,
  });
}

export function useApproveBookingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveBookingRequest,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["booking-requests"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Prenotazione approvata",
        description: "La prenotazione è stata approvata con successo.",
      });
      await invalidateDashboardQueries(queryClient, [
        dashboardQueryKeys.pendingActions(),
        dashboardQueryKeys.todayEvents(),
      ]);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile approvare la prenotazione.",
        variant: "destructive",
      });
    },
  });
}

export function useDeclineBookingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: declineBookingRequest,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["booking-requests"] });
      toast({
        title: "Prenotazione rifiutata",
        description: "La prenotazione è stata rifiutata.",
      });
      await invalidateDashboardQueries(queryClient, [
        dashboardQueryKeys.pendingActions(),
        dashboardQueryKeys.todayEvents(),
      ]);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile rifiutare la prenotazione.",
        variant: "destructive",
      });
    },
  });
}

export function useCounterProposeBookingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      counterStart,
      counterEnd,
    }: {
      id: string;
      counterStart: string;
      counterEnd: string;
    }) => counterProposeBookingRequest(id, counterStart, counterEnd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-requests"] });
      toast({
        title: "Controproposta inviata",
        description: "La controproposta è stata inviata al cliente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile inviare la controproposta.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBookingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBookingRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-requests"] });
      toast({
        title: "Prenotazione eliminata",
        description: "La prenotazione è stata eliminata.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare la prenotazione.",
        variant: "destructive",
      });
    },
  });
}
