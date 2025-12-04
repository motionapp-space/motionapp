import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertBookingSettings } from "../api/booking-settings.api";
import { toast } from "@/hooks/use-toast";
import type { UpdateBookingSettingsInput } from "../types";

export function useUpdateBookingSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateBookingSettingsInput) => upsertBookingSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-settings"] });
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
