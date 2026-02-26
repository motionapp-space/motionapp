import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ============================================================
// ASSIGNMENT STATUS — SOLE SOURCE OF TRUTH
// client_plan_assignments.status is the ONLY source of truth
// for the plan lifecycle. client_plans.status is legacy/frozen
// and must NEVER be updated by the FSM.
// ============================================================
type AssignmentStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

// Legacy type kept ONLY for plan_state_logs backward compatibility.
// plan_state_logs uses the DB enum plan_status (IN_CORSO/COMPLETATO/ELIMINATO).
type LegacyPlanStatus = 'IN_CORSO' | 'COMPLETATO' | 'ELIMINATO';

type ActorType = 'SYSTEM' | 'PT';

// Maps AssignmentStatus → legacy plan_status for plan_state_logs
const ASSIGNMENT_TO_LEGACY_STATUS: Record<string, LegacyPlanStatus> = {
  'ACTIVE': 'IN_CORSO',
  'INACTIVE': 'COMPLETATO',
  'DELETED': 'ELIMINATO',
};

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

    // Verify coach-client relationship
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

    // Fetch client data
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

    // Attach coach_client info
    client.coach_client_id = coachClientCheck.id;
    client.coach_client_status = coachClientCheck.status;

    console.log(`Coach-client status: ${coachClientCheck.status}`);

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

// ============================================================
// Logging helper — uses legacy enum values for plan_state_logs
// backward compatibility. The DB column is enum plan_status.
// ============================================================
async function logPlanTransition(
  supabase: any,
  planId: string,
  clientId: string,
  fromStatus: LegacyPlanStatus | null,
  toStatus: LegacyPlanStatus,
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

// ============================================================
// ASSIGN_PLAN — Atomic via Postgres RPC (single transaction)
// ============================================================
async function assignPlan(supabase: any, client: any, userId: string, metadata: any) {
  // Check archived status
  if (client.coach_client_status === 'archived') {
    throw new Error('Cannot assign plan to archived client');
  }

  const coachClientId = client.coach_client_id;
  if (!coachClientId) {
    throw new Error('Coach-client relationship not found');
  }

  // Single atomic RPC call — all logic runs in one DB transaction.
  // If any step fails, the entire transaction is rolled back.
  // No partial state can survive an error.
  const { data, error } = await supabase.rpc('fsm_assign_plan', {
    p_coach_id: userId,
    p_client_id: client.id,
    p_coach_client_id: coachClientId,
    p_plan_name: metadata?.name || 'New Plan',
    p_plan_description: metadata?.description || null,
    p_plan_data: metadata?.data || { days: [] },
  });

  if (error) {
    console.error('RPC fsm_assign_plan error:', error);
    throw error;
  }

  console.log('ASSIGN_PLAN result:', JSON.stringify(data));

  // Return plan object for backward compat with callers expecting { plan: { id } }
  return {
    success: true,
    plan: { id: data.plan_id },
    old_assignment_closed: data.old_assignment_closed,
  };
}

// ============================================================
// ARCHIVE_CLIENT
// Closes ACTIVE assignments, archives coach_clients relationship.
// ⚠️ Does NOT update client_plans.status (frozen/legacy).
// ============================================================
async function archiveClient(supabase: any, client: any, userId: string) {
  const coachClientId = client.coach_client_id;

  console.log(`Archiving client ${client.id}, coach_client_status: ${client.coach_client_status}`);

  if (client.coach_client_status === 'archived') {
    return { success: true, message: 'Already archived' };
  }

  // Close all ACTIVE assignments for this coach-client pair
  // ✅ Source of truth: client_plan_assignments.status
  const { data: closedAssignments } = await supabase
    .from('client_plan_assignments')
    .update({ status: 'INACTIVE' as AssignmentStatus, ended_at: new Date().toISOString() })
    .eq('coach_id', userId)
    .eq('client_id', client.id)
    .eq('status', 'ACTIVE')
    .select('id, plan_id');

  // Log closures (non-blocking intent, but awaited for consistency)
  if (closedAssignments && closedAssignments.length > 0) {
    for (const assignment of closedAssignments) {
      await logPlanTransition(
        supabase,
        assignment.plan_id,
        client.id,
        'IN_CORSO',
        'COMPLETATO',
        'AUTO_COMPLETE_ON_ARCHIVE',
        userId
      );
    }
  }

  const { error: ccError } = await supabase
    .from('coach_clients')
    .update({ status: 'archived' })
    .eq('id', coachClientId);

  if (ccError) {
    console.error('Archive update error on coach_clients:', ccError);
    throw ccError;
  }

  console.log(`Client ${client.id} archived successfully`);
  return { success: true };
}

// ============================================================
// UNARCHIVE_CLIENT
// Restores coach_clients status. Assignments remain closed.
// ============================================================
async function unarchiveClient(supabase: any, client: any, userId: string) {
  const coachClientId = client.coach_client_id;

  if (client.coach_client_status !== 'archived') {
    throw new Error('Client is not archived');
  }

  const { error: ccError } = await supabase
    .from('coach_clients')
    .update({ status: 'active' })
    .eq('id', coachClientId);

  if (ccError) throw ccError;

  return { success: true };
}

// ============================================================
// DELETE_PLAN
// Validates via client_plan_assignments (source of truth).
// ⚠️ Does NOT update client_plans.status (frozen/legacy).
// Only updates client_plans.deleted_at and is_visible.
// ============================================================
async function deletePlan(supabase: any, client: any, planId: string, userId: string) {
  const coachClientId = client.coach_client_id;

  // Validate: check assignment status (source of truth), not client_plans.status
  // Use maybeSingle() to handle duplicate assignments gracefully
  const { data: assignment, error: assignmentError } = await supabase
    .from('client_plan_assignments')
    .select('id, status')
    .eq('plan_id', planId)
    .eq('coach_id', userId)
    .eq('client_id', client.id)
    .order('assigned_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assignmentError || !assignment) {
    // Fallback: check if plan exists in client_plans for backward compat
    const { data: plan, error: planError } = await supabase
      .from('client_plans')
      .select('id, status')
      .eq('id', planId)
      .eq('coach_client_id', coachClientId)
      .single();

    if (planError || !plan) {
      throw new Error('Plan not found');
    }

    // Legacy plan without assignment — allow delete if not already deleted
    if (plan.status === 'ELIMINATO') {
      throw new Error('Cannot delete an already deleted plan');
    }
  } else {
    // Assignment-based validation
    if (assignment.status === 'DELETED') {
      throw new Error('Cannot delete an already deleted plan');
    }
    if (assignment.status === 'INACTIVE') {
      throw new Error('Cannot delete an inactive plan');
    }
  }

  // Update client_plans: metadata only, NOT status (frozen/legacy)
  // ⚠️ client_plans.status is FROZEN — do NOT update it.
  const { error } = await supabase
    .from('client_plans')
    .update({
      is_visible: false,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', planId);

  if (error) throw error;

  // Close ALL assignments for this plan (handles duplicates)
  await supabase
    .from('client_plan_assignments')
    .update({
      status: 'DELETED' as AssignmentStatus,
      ended_at: new Date().toISOString(),
    })
    .eq('plan_id', planId)
    .eq('coach_id', userId)
    .eq('client_id', client.id);

  await logPlanTransition(supabase, planId, client.id, 'IN_CORSO', 'ELIMINATO', 'DELETE_PLAN', userId);

  return { success: true };
}

// ============================================================
// COMPLETE_PLAN
// Validates via client_plan_assignments (source of truth).
// ⚠️ Does NOT update client_plans.status (frozen/legacy).
// Only updates client_plans.locked_at and completed_at.
// ============================================================
async function completePlan(supabase: any, client: any, planId: string, userId: string) {
  const coachClientId = client.coach_client_id;

  // Validate: check assignment status (source of truth)
  const { data: assignment, error: assignmentError } = await supabase
    .from('client_plan_assignments')
    .select('id, status')
    .eq('plan_id', planId)
    .eq('coach_id', userId)
    .eq('client_id', client.id)
    .single();

  if (assignmentError || !assignment) {
    // Fallback: legacy plan without assignment
    const { data: plan, error: planError } = await supabase
      .from('client_plans')
      .select('id, status')
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
  } else {
    if (assignment.status === 'INACTIVE') {
      return { success: true, message: 'Already inactive' };
    }
    if (assignment.status === 'DELETED') {
      throw new Error('Cannot complete a deleted plan');
    }
  }

  // Update client_plans: temporal metadata only, NOT status (frozen/legacy)
  // ⚠️ client_plans.status is FROZEN — do NOT update it.
  const { error } = await supabase
    .from('client_plans')
    .update({
      locked_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .eq('id', planId);

  if (error) throw error;

  // Close assignment (source of truth)
  if (assignment) {
    await supabase
      .from('client_plan_assignments')
      .update({
        status: 'INACTIVE' as AssignmentStatus,
        ended_at: new Date().toISOString(),
      })
      .eq('id', assignment.id);
  }

  await logPlanTransition(supabase, planId, client.id, 'IN_CORSO', 'COMPLETATO', 'COMPLETE_PLAN', userId);

  return { success: true };
}

// ============================================================
// CLIENT_LOGS_IN — Updates last_access_at only, no status change
// ============================================================
async function clientLogsIn(supabase: any, client: any) {
  await supabase
    .from('clients')
    .update({ last_access_at: new Date().toISOString() })
    .eq('id', client.id);
  return { success: true, message: 'Last access updated' };
}
