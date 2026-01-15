import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCoachSettings, updateCoachSettings } from "../api/coach-settings.api";
import type { UpdateCoachSettingsInput } from "../types";
import { toast } from "sonner";

export function useCoachSettings() {
  return useQuery({
    queryKey: ["coach-settings"],
    queryFn: getCoachSettings,
  });
}

export function useUpdateCoachSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: UpdateCoachSettingsInput) => updateCoachSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach-settings"] });
      toast.success("Impostazioni aggiornate");
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile aggiornare le impostazioni",
      });
    },
  });
}
