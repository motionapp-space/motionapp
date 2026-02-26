import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get token from query params or body
    let token: string | null = null;
    
    const url = new URL(req.url);
    token = url.searchParams.get('token');
    
    if (!token && req.method === 'POST') {
      const body = await req.json();
      token = body.token;
    }

    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Missing token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validating invite token: ${token.substring(0, 8)}...`);

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Find the invite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('client_invites')
      .select(`
        id,
        email,
        status,
        expires_at,
        client_id,
        clients (
          first_name,
          last_name,
          user_id
        )
      `)
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      console.error('Invite not found:', inviteError);
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid invite token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already used
    if (invite.status !== 'pending') {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: invite.status === 'accepted' 
            ? 'This invite has already been used' 
            : 'This invite is no longer valid'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    if (now > expiresAt) {
      // Mark as expired
      await supabaseAdmin
        .from('client_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id);

      return new Response(
        JSON.stringify({ valid: false, error: 'This invite has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if client already has account
    const clientData = invite.clients as unknown as { first_name: string; last_name: string; user_id: string | null } | null;
    if (clientData?.user_id) {
      return new Response(
        JSON.stringify({ valid: false, error: 'An account already exists for this client' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Invite valid for: ${clientData?.first_name} ${clientData?.last_name}`);

    return new Response(
      JSON.stringify({
        valid: true,
        email: invite.email,
        clientName: clientData ? `${clientData.first_name} ${clientData.last_name}` : 'Unknown',
        expiresAt: invite.expires_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ valid: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
