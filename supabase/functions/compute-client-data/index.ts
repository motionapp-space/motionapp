import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComputeRequest {
  clientIds: string[];
}

interface ComputedClientData {
  client_id: string;
  plan_weeks_since_assignment: number | null;
  package_status: 'active' | 'low' | 'expired' | 'none';
  appointment_status: 'planned' | 'unplanned';
  activity_status: 'active' | 'low' | 'inactive';
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

    console.log(`Computed data for ${data?.length || 0} clients`);

    return new Response(JSON.stringify({ data }), {
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
