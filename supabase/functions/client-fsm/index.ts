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

    console.log(`FSM Action: ${action} for client ${clientId}`);

    // First verify the coach-client relationship
    const { data: coachClientCheck, error: ccError } = await supabaseClient
      .from('coach_clients')
      .select('id, client_id')
      .eq('client_id', clientId)
      .eq('coach_id', user.id)
      .single();

    if (ccError || !coachClientCheck) {
      console.error('Coach-client relationship not found:', ccError);
      return new Response(JSON.stringify({ error: 'Client not found or unauthorized' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Then fetch the client data
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      console.error('Client fetch error:', clientError);
      return new Response(JSON.stringify({ error: 'Client not found', details: clientError?.message }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Attach coach_client_id for use in handlers
    client.coach_client_id = coachClientCheck.id;

    console.log(`Client status: ${client.status}, active_plan_id: ${client.active_plan_id}`);

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
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error stack:', errorStack);
    return new Response(JSON.stringify({ error: errorMessage, stack: errorStack }), {
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

  // Use the coach_client_id already attached to client
  const coachClientId = client.coach_client_id;
  if (!coachClientId) {
    throw new Error('Coach-client relationship not found');
  }

  // Check if there are any existing IN_CORSO plans (handle multiple)
  const { data: existingPlans } = await supabase
    .from('client_plans')
    .select('*')
    .eq('coach_client_id', coachClientId)
    .eq('status', 'IN_CORSO')
    .eq('is_visible', true);

  // Auto-complete all existing IN_CORSO plans
  if (existingPlans && existingPlans.length > 0) {
    const now = new Date().toISOString();
    
    for (const plan of existingPlans) {
      await supabase
        .from('client_plans')
        .update({
          status: 'COMPLETATO',
          locked_at: now,
          completed_at: now,
        })
        .eq('id', plan.id);

      await logPlanTransition(supabase, plan.id, client.id, 'IN_CORSO', 'COMPLETATO', 'AUTO_COMPLETE_ON_NEW_PLAN', userId);
    }
  }

  // Create new plan
  const { data: newPlan, error: planError } = await supabase
    .from('client_plans')
    .insert({
      coach_client_id: coachClientId,
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
  console.log(`Archiving client ${client.id}, current status: ${client.status}, active_plan_id: ${client.active_plan_id}`);
  
  if (client.status === 'ARCHIVIATO') {
    return { success: true, message: 'Already archived' };
  }

  const fromStatus = client.status;

  // CASO I: If there's an IN_CORSO plan, complete it automatically
  if (client.active_plan_id) {
    console.log(`Auto-completing active plan ${client.active_plan_id} before archiving`);
    
    const { data: activePlan, error: planFetchError } = await supabase
      .from('client_plans')
      .select('*')
      .eq('id', client.active_plan_id)
      .single();

    if (planFetchError) {
      console.error('Failed to fetch active plan:', planFetchError);
      throw new Error('Failed to fetch active plan');
    }

    if (activePlan && activePlan.status === 'IN_CORSO') {
      // Complete and lock the plan
      const { error: planUpdateError } = await supabase
        .from('client_plans')
        .update({
          status: 'COMPLETATO',
          locked_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          is_visible: true, // Keep visible in history
        })
        .eq('id', activePlan.id);

      if (planUpdateError) {
        console.error('Failed to complete plan:', planUpdateError);
        throw new Error('Failed to complete plan before archiving');
      }

      // Log plan transition
      await logPlanTransition(
        supabase,
        activePlan.id,
        client.id,
        'IN_CORSO',
        'COMPLETATO',
        'AUTO_COMPLETE_ON_ARCHIVE',
        userId
      );

      console.log(`Plan ${activePlan.id} auto-completed`);
    }
  }

  // Update client: set to ARCHIVIATO and clear active_plan_id
  const { error } = await supabase
    .from('clients')
    .update({
      status: 'ARCHIVIATO',
      archived_at: new Date().toISOString(),
      active_plan_id: null,
    })
    .eq('id', client.id);

  if (error) {
    console.error('Archive update error:', error);
    throw error;
  }

  await logClientTransition(supabase, client.id, fromStatus, 'ARCHIVIATO', 'ARCHIVE_CLIENT', userId);

  console.log(`Client ${client.id} archived successfully`);
  return { success: true };
}

async function unarchiveClient(supabase: any, client: any, userId: string) {
  if (client.status !== 'ARCHIVIATO') {
    throw new Error('Client is not archived');
  }

  const { error } = await supabase
    .from('clients')
    .update({
      status: 'POTENZIALE',
      archived_at: null,
      active_plan_id: null,
    })
    .eq('id', client.id);

  if (error) throw error;

  await logClientTransition(supabase, client.id, 'ARCHIVIATO', 'POTENZIALE', 'UNARCHIVE_CLIENT', userId);

  return { success: true };
}

async function deletePlan(supabase: any, client: any, planId: string, userId: string) {
  // Use the coach_client_id already attached to client
  const coachClientId = client.coach_client_id;

  const { data: plan, error: planError } = await supabase
    .from('client_plans')
    .select('*')
    .eq('id', planId)
    .eq('coach_client_id', coachClientId)
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
  // Use the coach_client_id already attached to client
  const coachClientId = client.coach_client_id;

  const { data: plan, error: planError } = await supabase
    .from('client_plans')
    .select('*')
    .eq('id', planId)
    .eq('coach_client_id', coachClientId)
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