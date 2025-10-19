import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteEvent } from "../api/events.api";
import { toast } from "@/hooks/use-toast";

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Appuntamento eliminato",
        description: "L'appuntamento è stato eliminato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare l'appuntamento.",
        variant: "destructive",
      });
    },
  });
}
