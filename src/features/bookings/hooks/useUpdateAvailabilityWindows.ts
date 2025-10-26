import { useMutation, useQueryClient } from "@tanstack/react-query";
import { replaceAvailabilityWindows } from "../api/availability-windows.api";
import { toast } from "@/hooks/use-toast";
import type { CreateAvailabilityWindowInput } from "../types";

export function useUpdateAvailabilityWindows() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (windows: CreateAvailabilityWindowInput[]) =>
      replaceAvailabilityWindows(windows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-windows"] });
      toast({
        title: "Disponibilità aggiornata",
        description: "La tua disponibilità è stata aggiornata con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare la disponibilità.",
        variant: "destructive",
      });
    },
  });
}
