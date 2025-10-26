import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAvailabilityWindows,
  createAvailabilityWindow,
  deleteAvailabilityWindow,
  bulkCreateAvailabilityWindows,
  clearAvailabilityWindows,
} from "../api/availability.api";
import { toast } from "@/hooks/use-toast";
import type { CreateAvailabilityWindowInput } from "../types";

export function useAvailabilityWindowsQuery() {
  return useQuery({
    queryKey: ["availability-windows"],
    queryFn: listAvailabilityWindows,
  });
}

export function useCreateAvailabilityWindow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAvailabilityWindow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-windows"] });
      toast({
        title: "Disponibilità aggiunta",
        description: "La finestra di disponibilità è stata aggiunta.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiungere la disponibilità.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteAvailabilityWindow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAvailabilityWindow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-windows"] });
      toast({
        title: "Disponibilità rimossa",
        description: "La finestra di disponibilità è stata rimossa.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile rimuovere la disponibilità.",
        variant: "destructive",
      });
    },
  });
}

export function useBulkCreateAvailabilityWindows() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkCreateAvailabilityWindows,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-windows"] });
      toast({
        title: "Disponibilità salvate",
        description: "Le finestre di disponibilità sono state salvate.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile salvare le disponibilità.",
        variant: "destructive",
      });
    },
  });
}

export function useClearAvailabilityWindows() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearAvailabilityWindows,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-windows"] });
      toast({
        title: "Disponibilità eliminate",
        description: "Tutte le finestre di disponibilità sono state eliminate.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare le disponibilità.",
        variant: "destructive",
      });
    },
  });
}
