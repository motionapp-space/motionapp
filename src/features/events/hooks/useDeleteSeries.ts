import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeleteSeriesResult {
  series_id: string;
  canceled_count: number;
  errors_count: number;
  total_events: number;
}

export function useDeleteSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (seriesId: string): Promise<DeleteSeriesResult> => {
      // ALLINEAMENTO TIMESTAMP: passa p_now dal client per coerenza con countFutureSeriesEvents
      const now = new Date().toISOString();
      
      const { data, error } = await supabase.rpc('cancel_series_with_ledger', {
        p_series_id: seriesId,
        p_actor: 'coach',
        p_now: now,
        p_only_future: true,
      });
      
      if (error) throw error;
      return data as unknown as DeleteSeriesResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["events"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["packages"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["package-ledger"], exact: false });
      
      if (result.canceled_count > 0) {
        toast.success(`Cancellati ${result.canceled_count} appuntamenti`, {
          description: "Il cliente riceverà una notifica per ogni cancellazione"
        });
      } else {
        toast.info("Nessun appuntamento futuro da cancellare");
      }
    },
    onError: (error: Error) => {
      toast.error("Errore nella cancellazione", { description: error.message });
    },
  });
}
