import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('Starting finalize_past_events...');
    
    const { data, error } = await supabase.rpc('finalize_past_events');
    
    if (error) {
      console.error('Error finalizing events:', error);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Finalized events result:', data);
    
    return new Response(JSON.stringify(data), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Fatal error in auto-complete-events:', err);
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
