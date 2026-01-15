import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSingleLessonPackage, createSingleLessonOrder } from "../api/single-lesson.api";
import { toast } from "sonner";

/**
 * @deprecated Use useCreateSingleLessonOrder instead
 * Creates a single lesson technical package
 */
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
      queryClient.invalidateQueries({ queryKey: ["packages", "coach-client", pkg.coach_client_id] });
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

/**
 * Creates a single lesson order directly (new flow - no package)
 */
export function useCreateSingleLessonOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      coachClientId, 
      eventStartAt 
    }: { 
      eventId: string; 
      coachClientId: string; 
      eventStartAt: string;
    }) => {
      return await createSingleLessonOrder(eventId, coachClientId, eventStartAt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      
      toast.success("Lezione singola creata", {
        description: "Ordine creato per questo appuntamento",
      });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message,
      });
    },
  });
}
