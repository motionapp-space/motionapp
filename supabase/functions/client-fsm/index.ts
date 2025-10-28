import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ClientStatus = 'POTENZIALE' | 'ATTIVO' | 'INATTIVO' | 'ARCHIVIATO';
type PlanStatus = 'IN_CORSO' | 'COMPLETATO' | 'ELIMINATO';
type ActorType = 'SYSTEM' | 'PT';

interface TransitionRequest {
  action: string;
  clientId: string;
  planId?: string;
  version?: number;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const request: TransitionRequest = await req.json();
    const { action, clientId, planId, version, metadata } = request;

    // Fetch current client state
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('*, client_plans!inner(*)')
      .eq('id', clientId)
      .eq('coach_id', user.id)
      .single();

    if (clientError || !client) {
      return new Response(JSON.stringify({ error: 'Client not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Optimistic concurrency check
    if (version !== undefined && client.version !== version) {
      return new Response(JSON.stringify({ error: 'Version mismatch', currentVersion: client.version }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result;
    switch (action) {
      case 'ASSIGN_PLAN':
        result = await assignPlan(supabaseClient, client, user.id, metadata);
        break;
      case 'ARCHIVE_CLIENT':
        result = await archiveClient(supabaseClient, client, user.id);
        break;
      case 'UNARCHIVE_CLIENT':
        result = await unarchiveClient(supabaseClient, client, user.id);
        break;
      case 'DELETE_PLAN':
        result = await deletePlan(supabaseClient, client, planId!, user.id);
        break;
      case 'COMPLETE_PLAN':
        result = await completePlan(supabaseClient, client, planId!, user.id);
        break;
      case 'NO_ACCESS_X_DAYS':
        result = await markInactive(supabaseClient, client, metadata?.days || 30);
        break;
      case 'CLIENT_LOGS_IN':
        result = await clientLogsIn(supabaseClient, client);
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('FSM Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function logClientTransition(
  supabase: any,
  clientId: string,
  fromStatus: ClientStatus | null,
  toStatus: ClientStatus,
  cause: string,
  actorId: string,
  actorType: ActorType = 'PT'
) {
  await supabase.from('client_state_logs').insert({
    client_id: clientId,
    from_status: fromStatus,
    to_status: toStatus,
    cause,
    actor_type: actorType,
    actor_id: actorId,
  });
}

async function logPlanTransition(
  supabase: any,
  planId: string,
  clientId: string,
  fromStatus: PlanStatus | null,
  toStatus: PlanStatus,
  cause: string,
  actorId: string,
  actorType: ActorType = 'PT'
) {
  await supabase.from('plan_state_logs').insert({
    plan_id: planId,
    client_id: clientId,
    from_status: fromStatus,
    to_status: toStatus,
    cause,
    actor_type: actorType,
    actor_id: actorId,
  });
}

async function assignPlan(supabase: any, client: any, userId: string, metadata: any) {
  if (client.status === 'ARCHIVIATO') {
    throw new Error('Cannot assign plan to archived client');
  }

  const fromClientStatus = client.status;

  // Check if there's an existing IN_CORSO plan
  const { data: existingPlan } = await supabase
    .from('client_plans')
    .select('*')
    .eq('client_id', client.id)
    .eq('status', 'IN_CORSO')
    .eq('is_visible', true)
    .single();

  if (existingPlan) {
    // Auto-complete the existing plan
    await supabase
      .from('client_plans')
      .update({
        status: 'COMPLETATO',
        locked_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('id', existingPlan.id);

    await logPlanTransition(supabase, existingPlan.id, client.id, 'IN_CORSO', 'COMPLETATO', 'ASSIGN_NEW_PLAN', userId);
  }

  // Create new plan
  const { data: newPlan, error: planError } = await supabase
    .from('client_plans')
    .insert({
      client_id: client.id,
      coach_id: userId,
      name: metadata?.name || 'New Plan',
      description: metadata?.description,
      data: metadata?.data || { days: [] },
      status: 'IN_CORSO',
      is_visible: true,
    })
    .select()
    .single();

  if (planError) throw planError;

  await logPlanTransition(supabase, newPlan.id, client.id, null, 'IN_CORSO', 'ASSIGN_PLAN', userId);

  // Update client
  const { error: clientError } = await supabase
    .from('clients')
    .update({
      active_plan_id: newPlan.id,
      status: 'ATTIVO',
    })
    .eq('id', client.id);

  if (clientError) throw clientError;

  await logClientTransition(supabase, client.id, fromClientStatus, 'ATTIVO', 'ASSIGN_PLAN', userId);

  return { success: true, plan: newPlan };
}

async function archiveClient(supabase: any, client: any, userId: string) {
  if (client.status === 'ARCHIVIATO') {
    return { success: true, message: 'Already archived' };
  }

  if (client.active_plan_id) {
    throw new Error('Cannot archive client with active plan. Complete or delete the plan first.');
  }

  const fromStatus = client.status;

  const { error } = await supabase
    .from('clients')
    .update({
      status: 'ARCHIVIATO',
      archived_at: new Date().toISOString(),
    })
    .eq('id', client.id);

  if (error) throw error;

  await logClientTransition(supabase, client.id, fromStatus, 'ARCHIVIATO', 'ARCHIVE_CLIENT', userId);

  return { success: true };
}

async function unarchiveClient(supabase: any, client: any, userId: string) {
  if (client.status !== 'ARCHIVIATO') {
    return { success: true, message: 'Not archived' };
  }

  const { error } = await supabase
    .from('clients')
    .update({
      status: 'POTENZIALE',
      archived_at: null,
    })
    .eq('id', client.id);

  if (error) throw error;

  await logClientTransition(supabase, client.id, 'ARCHIVIATO', 'POTENZIALE', 'UNARCHIVE_CLIENT', userId);

  return { success: true };
}

async function deletePlan(supabase: any, client: any, planId: string, userId: string) {
  const { data: plan, error: planError } = await supabase
    .from('client_plans')
    .select('*')
    .eq('id', planId)
    .eq('client_id', client.id)
    .single();

  if (planError || !plan) {
    throw new Error('Plan not found');
  }

  if (plan.status === 'COMPLETATO' || plan.status === 'ELIMINATO') {
    throw new Error('Cannot delete a completed or already deleted plan');
  }

  // Soft delete the plan
  const { error } = await supabase
    .from('client_plans')
    .update({
      status: 'ELIMINATO',
      is_visible: false,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', planId);

  if (error) throw error;

  await logPlanTransition(supabase, planId, client.id, 'IN_CORSO', 'ELIMINATO', 'DELETE_PLAN', userId);

  // Update client status
  const { error: clientError } = await supabase
    .from('clients')
    .update({
      active_plan_id: null,
      status: 'POTENZIALE',
    })
    .eq('id', client.id);

  if (clientError) throw clientError;

  await logClientTransition(supabase, client.id, 'ATTIVO', 'POTENZIALE', 'DELETE_PLAN', userId);

  return { success: true };
}

async function completePlan(supabase: any, client: any, planId: string, userId: string) {
  const { data: plan, error: planError } = await supabase
    .from('client_plans')
    .select('*')
    .eq('id', planId)
    .eq('client_id', client.id)
    .single();

  if (planError || !plan) {
    throw new Error('Plan not found');
  }

  if (plan.status === 'COMPLETATO') {
    return { success: true, message: 'Already completed' };
  }

  if (plan.status === 'ELIMINATO') {
    throw new Error('Cannot complete a deleted plan');
  }

  // Complete the plan
  const { error } = await supabase
    .from('client_plans')
    .update({
      status: 'COMPLETATO',
      locked_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .eq('id', planId);

  if (error) throw error;

  await logPlanTransition(supabase, planId, client.id, 'IN_CORSO', 'COMPLETATO', 'COMPLETE_PLAN', userId);

  // Update client status
  const { error: clientError } = await supabase
    .from('clients')
    .update({
      active_plan_id: null,
      status: 'POTENZIALE',
    })
    .eq('id', client.id);

  if (clientError) throw clientError;

  await logClientTransition(supabase, client.id, 'ATTIVO', 'POTENZIALE', 'COMPLETE_PLAN', userId);

  return { success: true };
}

async function markInactive(supabase: any, client: any, days: number) {
  if (client.status !== 'ATTIVO') {
    return { success: false, message: 'Client is not active' };
  }

  const lastAccess = client.last_access_at ? new Date(client.last_access_at) : new Date(client.created_at);
  const daysSinceAccess = (Date.now() - lastAccess.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceAccess < days) {
    return { success: false, message: 'Not enough days since last access' };
  }

  const { error } = await supabase
    .from('clients')
    .update({ status: 'INATTIVO' })
    .eq('id', client.id);

  if (error) throw error;

  await logClientTransition(supabase, client.id, 'ATTIVO', 'INATTIVO', 'NO_ACCESS_X_DAYS', 'system', 'SYSTEM');

  return { success: true };
}

async function clientLogsIn(supabase: any, client: any) {
  if (client.status !== 'INATTIVO') {
    // Just update last_access_at
    await supabase
      .from('clients')
      .update({ last_access_at: new Date().toISOString() })
      .eq('id', client.id);
    return { success: true, message: 'Last access updated' };
  }

  const { error } = await supabase
    .from('clients')
    .update({
      status: 'ATTIVO',
      last_access_at: new Date().toISOString(),
    })
    .eq('id', client.id);

  if (error) throw error;

  await logClientTransition(supabase, client.id, 'INATTIVO', 'ATTIVO', 'CLIENT_LOGS_IN', client.id, 'SYSTEM');

  return { success: true };
}