import { supabase } from "@/integrations/supabase/client";

interface FSMTransitionRequest {
  action: string;
  clientId: string;
  planId?: string;
  version?: number;
  metadata?: Record<string, any>;
}

export async function executeClientTransition(request: FSMTransitionRequest) {
  const { data, error } = await supabase.functions.invoke('client-fsm', {
    body: request,
  });

  if (error) throw error;
  return data;
}

export async function assignPlanToClient(clientId: string, planData: {
  name: string;
  description?: string;
  data?: any;
}, version?: number) {
  return executeClientTransition({
    action: 'ASSIGN_PLAN',
    clientId,
    version,
    metadata: planData,
  });
}

export async function archiveClient(clientId: string, version?: number) {
  return executeClientTransition({
    action: 'ARCHIVE_CLIENT',
    clientId,
    version,
  });
}

export async function unarchiveClient(clientId: string, version?: number) {
  return executeClientTransition({
    action: 'UNARCHIVE_CLIENT',
    clientId,
    version,
  });
}

export async function deletePlan(clientId: string, planId: string, version?: number) {
  return executeClientTransition({
    action: 'DELETE_PLAN',
    clientId,
    planId,
    version,
  });
}

export async function completePlan(clientId: string, planId: string, version?: number) {
  return executeClientTransition({
    action: 'COMPLETE_PLAN',
    clientId,
    planId,
    version,
  });
}

export async function markClientInactive(clientId: string, days: number) {
  return executeClientTransition({
    action: 'NO_ACCESS_X_DAYS',
    clientId,
    metadata: { days },
  });
}

export async function recordClientLogin(clientId: string) {
  return executeClientTransition({
    action: 'CLIENT_LOGS_IN',
    clientId,
  });
}