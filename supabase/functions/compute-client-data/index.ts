import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ComputeRequest {
  clientIds: string[];
}

interface RpcRow {
  client_id: string;
  plan_weeks_since_assignment: number | null;
  package_status: string;
  appointment_status: string;
  activity_status: string;
  next_appointment_date: string | null;
  has_active_plan: boolean;
}

interface ComputedClientData {
  client_id: string;
  plan_weeks_since_assignment: number | null;
  package_status: 'active' | 'low' | 'expired' | 'none';
  appointment_status: 'planned' | 'unplanned';
  activity_status: 'active' | 'low' | 'inactive';
  next_appointment_date: string | null;
  has_active_plan: boolean;
}

/**
 * Mappa righe RPC al formato ComputedClientData
 * Esportata per testing
 */
export function mapRpcRowToComputedData(row: RpcRow): ComputedClientData {
  return {
    client_id: row.client_id,
    plan_weeks_since_assignment: row.plan_weeks_since_assignment,
    package_status: row.package_status as ComputedClientData['package_status'],
    appointment_status: row.appointment_status as ComputedClientData['appointment_status'],
    activity_status: row.activity_status as ComputedClientData['activity_status'],
    next_appointment_date: row.next_appointment_date,
    has_active_plan: row.has_active_plan ?? false,
  };
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

    const request: ComputeRequest = await req.json();
    const { clientIds } = request;

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid client IDs' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Computing data for ${clientIds.length} clients`);

    // Call the database function
    const { data, error } = await supabaseClient
      .rpc('compute_client_table_data_batch', { p_client_ids: clientIds });

    if (error) {
      console.error('Database function error:', error);
      throw error;
    }

    // Map RPC rows to ComputedClientData
    const mappedData = (data || []).map(mapRpcRowToComputedData);

    console.log(`Computed data for ${mappedData.length} clients`);

    return new Response(JSON.stringify({ data: mappedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Compute Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
