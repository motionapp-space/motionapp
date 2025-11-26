import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientsQuery } from "./useClientsQuery";

export type OnboardingStateType = 'ZERO_CLIENTS' | 'FIRST_CLIENT_NO_CONTENT' | 'ACTIVE_USER';

export interface OnboardingState {
  state: OnboardingStateType;
  clientsCount: number;
  hasAnyPlan: boolean;
  hasAnyAppointment: boolean;
  hasArchivedClients: boolean;
  isLoading: boolean;
}

export function useOnboardingState(): OnboardingState {
  // Query clienti NON archiviati con limit minimo per performance
  const clientsQuery = useClientsQuery({ 
    limit: 1, 
    includeArchived: false 
  });

  // Check esistenza piano attivo (ottimizzato: limit 1, solo id)
  const plansQuery = useQuery({
    queryKey: ['onboarding-plans-check'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      const { data, error } = await supabase
        .from('client_plans')
        .select('id')
        .eq('coach_id', user.user.id)
        .eq('status', 'IN_CORSO')
        .limit(1);

      if (error) throw error;
      return (data?.length || 0) > 0;
    },
    staleTime: 30000, // 30s cache
  });

  // Check esistenza appuntamento futuro (ottimizzato: limit 1, solo id)
  const eventsQuery = useQuery({
    queryKey: ['onboarding-events-check'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('coach_id', user.user.id)
        .limit(1);

      if (error) throw error;
      return (data?.length || 0) > 0;
    },
    staleTime: 30000, // 30s cache
  });

  // Check esistenza clienti archiviati (ottimizzato: limit 1, solo id)
  const archivedQuery = useQuery({
    queryKey: ['onboarding-archived-check'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('coach_id', user.user.id)
        .not('archived_at', 'is', null)
        .limit(1);

      if (error) throw error;
      return (data?.length || 0) > 0;
    },
    staleTime: 30000, // 30s cache
  });

  // Calcola isLoading dai veri stati delle query
  const isLoading = clientsQuery.isLoading || plansQuery.isLoading || eventsQuery.isLoading || archivedQuery.isLoading;

  // Valori sicuri (defaults)
  const clientsCount = clientsQuery.data?.total || 0;
  const hasAnyPlan = plansQuery.data || false;
  const hasAnyAppointment = eventsQuery.data || false;
  const hasArchivedClients = archivedQuery.data || false;

  // Determina stato onboarding
  let state: OnboardingStateType;
  if (clientsCount === 0) {
    state = 'ZERO_CLIENTS';
  } else if (!hasAnyPlan && !hasAnyAppointment) {
    state = 'FIRST_CLIENT_NO_CONTENT';
  } else {
    state = 'ACTIVE_USER';
  }

  return { 
    state, 
    clientsCount, 
    hasAnyPlan, 
    hasAnyAppointment, 
    hasArchivedClients,
    isLoading 
  };
}
