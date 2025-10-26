import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBookingSettings, upsertBookingSettings } from "../api/booking-settings.api";
import { toast } from "@/hooks/use-toast";
import type { UpdateBookingSettingsInput } from "../types";

export function useBookingSettingsQuery() {
  return useQuery({
    queryKey: ["booking-settings"],
    queryFn: getBookingSettings,
  });
}

export function useUpdateBookingSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateBookingSettingsInput) => upsertBookingSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-settings"] });
      toast({
        title: "Impostazioni salvate",
        description: "Le impostazioni sono state aggiornate con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile salvare le impostazioni.",
        variant: "destructive",
      });
    },
  });
}
