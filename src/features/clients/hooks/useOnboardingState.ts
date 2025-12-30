import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Query per ottenere il count reale dei clienti NON archiviati (via coach_clients)
  const nonArchivedCountQuery = useQuery({
    queryKey: ['onboarding-non-archived-count'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return 0;

      // Get client IDs from coach_clients
      const { data: ccData, error: ccError } = await supabase
        .from('coach_clients')
        .select('client_id')
        .eq('coach_id', user.user.id)
        .eq('status', 'active');

      if (ccError) throw ccError;
      const clientIds = ccData?.map(cc => cc.client_id) || [];
      if (clientIds.length === 0) return 0;

      const { count, error } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .in('id', clientIds)
        .is('archived_at', null);

      if (error) throw error;
      return count || 0;
    },
    staleTime: 30000,
    enabled: isAuthenticated === true,
  });

  // Query per verifica esistenza di almeno un cliente (per stato ZERO_CLIENTS)
  const clientsQuery = useClientsQuery({ 
    limit: 1, 
    includeArchived: false 
  });

  // Get coach_clients for plans check
  const coachClientsQuery = useQuery({
    queryKey: ['onboarding-coach-clients'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('coach_clients')
        .select('id')
        .eq('coach_id', user.user.id);

      if (error) throw error;
      return data?.map(cc => cc.id) || [];
    },
    staleTime: 30000,
    enabled: isAuthenticated === true,
  });

  // Check esistenza piano attivo (ottimizzato: limit 1, solo id)
  const plansQuery = useQuery({
    queryKey: ['onboarding-plans-check'],
    queryFn: async () => {
      const coachClientIds = coachClientsQuery.data || [];
      if (coachClientIds.length === 0) return false;

      const { data, error } = await supabase
        .from('client_plans')
        .select('id')
        .in('coach_client_id', coachClientIds)
        .eq('status', 'IN_CORSO')
        .limit(1);

      if (error) throw error;
      return (data?.length || 0) > 0;
    },
    staleTime: 30000, // 30s cache
    enabled: isAuthenticated === true && (coachClientsQuery.data?.length || 0) > 0,
  });

  // Check esistenza appuntamento futuro (ottimizzato: limit 1, solo id)
  const eventsQuery = useQuery({
    queryKey: ['onboarding-events-check'],
    queryFn: async () => {
      const coachClientIds = coachClientsQuery.data || [];
      if (coachClientIds.length === 0) return false;

      const { data, error } = await supabase
        .from('events')
        .select('id')
        .in('coach_client_id', coachClientIds)
        .limit(1);

      if (error) throw error;
      return (data?.length || 0) > 0;
    },
    staleTime: 30000, // 30s cache
    enabled: isAuthenticated === true && (coachClientsQuery.data?.length || 0) > 0,
  });

  // Check esistenza clienti archiviati (via coach_clients)
  const archivedQuery = useQuery({
    queryKey: ['onboarding-archived-check'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      const coachClientIds = coachClientsQuery.data || [];
      if (coachClientIds.length === 0) return false;

      // Get client_ids from coach_clients
      const { data: ccData, error: ccError } = await supabase
        .from('coach_clients')
        .select('client_id')
        .eq('coach_id', user.user.id);

      if (ccError) throw ccError;
      const clientIds = ccData?.map(cc => cc.client_id) || [];
      if (clientIds.length === 0) return false;

      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .in('id', clientIds)
        .not('archived_at', 'is', null)
        .limit(1);

      if (error) throw error;
      return (data?.length || 0) > 0;
    },
    staleTime: 30000,
    enabled: isAuthenticated === true,
  });

  // Calcola isLoading dai veri stati delle query
  const isLoading = clientsQuery.isLoading || nonArchivedCountQuery.isLoading || coachClientsQuery.isLoading || plansQuery.isLoading || eventsQuery.isLoading || archivedQuery.isLoading;

  // Valori sicuri (defaults)
  const clientsCount = nonArchivedCountQuery.data || 0;  // Count reale di clienti non archiviati
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
