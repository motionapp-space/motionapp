import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCoachInvites, createCoachInvite, CreateInviteData, CoachInvite } from "../api/coachInvites.api";
import { toast } from "sonner";

const QUERY_KEY = ["coach-invites"];

export function useCoachInvites() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchCoachInvites,
  });
}

export function useCreateCoachInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInviteData) => createCoachInvite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Invito creato con successo");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Errore nella creazione dell'invito");
    },
  });
}
