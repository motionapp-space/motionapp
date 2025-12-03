import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSingleLessonPackage } from "../api/single-lesson.api";
import { toast } from "sonner";

export function useCreateSingleLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      clientId, 
      eventStartAt 
    }: { 
      eventId: string; 
      clientId: string; 
      eventStartAt: string;
    }) => {
      return await createSingleLessonPackage(eventId, clientId, eventStartAt);
    },
    onSuccess: (pkg) => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["packages", "client", pkg.client_id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      
      toast.success("Lezione singola creata", {
        description: "Pacchetto da 1 sessione creato per questo appuntamento",
      });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message,
      });
    },
  });
}
