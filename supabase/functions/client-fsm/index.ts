import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PlanStatus = 'IN_CORSO' | 'COMPLETATO' | 'ELIMINATO';
type ActorType = 'SYSTEM' | 'PT';

interface TransitionRequest {
  action: string;
  clientId: string;
  planId?: string;
  version?: number;
  metadata?: Record<string, any>;
}

Deno.serve(async (req) => {
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

    // First verify the coach-client relationship and get its status
    const { data: coachClientCheck, error: ccError } = await supabaseClient
      .from('coach_clients')
      .select('id, client_id, status')
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

    // Attach coach_client info for use in handlers
    client.coach_client_id = coachClientCheck.id;
    client.coach_client_status = coachClientCheck.status;

    console.log(`Coach-client status: ${coachClientCheck.status}, active_plan_id: ${client.active_plan_id}`);

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
      case 'CLIENT_LOGS_IN':
        result = await clientLogsIn(supabaseClient, client);
        break;
      // NO_ACCESS_X_DAYS is REMOVED - no longer supported
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
  // Check archived status via coach_clients.status (new model)
  if (client.coach_client_status === 'archived') {
    throw new Error('Cannot assign plan to archived client');
  }

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

  // Update client active_plan_id ONLY - NO status change
  const { error: clientError } = await supabase
    .from('clients')
    .update({
      active_plan_id: newPlan.id,
    })
    .eq('id', client.id);

  if (clientError) throw clientError;

  return { success: true, plan: newPlan };
}

async function archiveClient(supabase: any, client: any, userId: string) {
  const coachClientId = client.coach_client_id;
  
  console.log(`Archiving client ${client.id}, coach_client_status: ${client.coach_client_status}, active_plan_id: ${client.active_plan_id}`);
  
  // Check if already archived via coach_clients.status
  if (client.coach_client_status === 'archived') {
    return { success: true, message: 'Already archived' };
  }

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
      const { error: planUpdateError } = await supabase
        .from('client_plans')
        .update({
          status: 'COMPLETATO',
          locked_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          is_visible: true,
        })
        .eq('id', activePlan.id);

      if (planUpdateError) {
        console.error('Failed to complete plan:', planUpdateError);
        throw new Error('Failed to complete plan before archiving');
      }

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

  // Update coach_clients.status to 'archived' (NEW: relation-centric model)
  const { error: ccError } = await supabase
    .from('coach_clients')
    .update({ status: 'archived' })
    .eq('id', coachClientId);

  if (ccError) {
    console.error('Archive update error on coach_clients:', ccError);
    throw ccError;
  }

  // Clear active_plan_id on clients
  const { error: clientError } = await supabase
    .from('clients')
    .update({ active_plan_id: null })
    .eq('id', client.id);

  if (clientError) {
    console.error('Error clearing active_plan_id:', clientError);
    throw clientError;
  }

  console.log(`Client ${client.id} archived successfully via coach_clients`);
  return { success: true };
}

async function unarchiveClient(supabase: any, client: any, userId: string) {
  const coachClientId = client.coach_client_id;
  
  // Check if archived via coach_clients.status
  if (client.coach_client_status !== 'archived') {
    throw new Error('Client is not archived');
  }

  // Update coach_clients.status to 'active' (NEW: relation-centric model)
  const { error: ccError } = await supabase
    .from('coach_clients')
    .update({ status: 'active' })
    .eq('id', coachClientId);

  if (ccError) throw ccError;

  // Clear active_plan_id
  const { error: clientError } = await supabase
    .from('clients')
    .update({ active_plan_id: null })
    .eq('id', client.id);

  if (clientError) throw clientError;

  return { success: true };
}

async function deletePlan(supabase: any, client: any, planId: string, userId: string) {
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

  // Update client active_plan_id ONLY - NO status change
  const { error: clientError } = await supabase
    .from('clients')
    .update({ active_plan_id: null })
    .eq('id', client.id);

  if (clientError) throw clientError;

  return { success: true };
}

async function completePlan(supabase: any, client: any, planId: string, userId: string) {
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

  // Update client active_plan_id ONLY - NO status change
  const { error: clientError } = await supabase
    .from('clients')
    .update({ active_plan_id: null })
    .eq('id', client.id);

  if (clientError) throw clientError;

  return { success: true };
}

async function clientLogsIn(supabase: any, client: any) {
  // Simply update last_access_at - NO status change
  await supabase
    .from('clients')
    .update({ last_access_at: new Date().toISOString() })
    .eq('id', client.id);
  return { success: true, message: 'Last access updated' };
}
