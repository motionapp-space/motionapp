import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCoachClientId } from "@/lib/coach-client";

export interface ClientOnboardingState {
  needsOnboarding: boolean;
  hasPlans: boolean;
  hasAppointments: boolean;
  isLoading: boolean;
}

/**
 * Hook per verificare se un cliente specifico ha bisogno di onboarding
 * Controlla se il cliente ha almeno un piano o un appuntamento
 */
export function useClientOnboardingState(clientId: string): ClientOnboardingState {
  // Query piani del cliente (limit 1 per performance)
  const plansQuery = useQuery({
    queryKey: ['client-onboarding-plans', clientId],
    queryFn: async () => {
      const coachClientId = await getCoachClientId(clientId);
      
      const { data, error } = await supabase
        .from('client_plans')
        .select('id')
        .eq('coach_client_id', coachClientId)
        .is('deleted_at', null)
        .limit(1);

      if (error) throw error;
      return (data?.length || 0) > 0;
    },
    enabled: !!clientId,
    staleTime: 30000, // 30s cache
  });

  // Query appuntamenti del cliente (limit 1 per performance)
  const eventsQuery = useQuery({
    queryKey: ['client-onboarding-events', clientId],
    queryFn: async () => {
      const coachClientId = await getCoachClientId(clientId);
      
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('coach_client_id', coachClientId)
        .limit(1);

      if (error) throw error;
      return (data?.length || 0) > 0;
    },
    enabled: !!clientId,
    staleTime: 30000, // 30s cache
  });

  const isLoading = plansQuery.isLoading || eventsQuery.isLoading;
  const hasPlans = plansQuery.data || false;
  const hasAppointments = eventsQuery.data || false;

  // Needs onboarding se NON ha né piani né appuntamenti
  const needsOnboarding = !hasPlans && !hasAppointments;

  return {
    needsOnboarding,
    hasPlans,
    hasAppointments,
    isLoading,
  };
}
