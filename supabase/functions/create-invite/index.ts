import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { queueEmail } from "../_shared/email-outbox.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId } = await req.json();

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: clientId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth token
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the coach is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const coachId = user.id;
    console.log(`Coach ${coachId} creating invite for client ${clientId}`);

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify coach-client relationship exists
    const { data: coachClient, error: ccError } = await supabaseAdmin
      .from('coach_clients')
      .select('id, client_id')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .single();

    if (ccError || !coachClient) {
      console.error('Coach-client relationship not found:', ccError);
      return new Response(
        JSON.stringify({ error: 'Client not found or not associated with this coach' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch client data
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, email, user_id, first_name, last_name')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      console.error('Client not found:', clientError);
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if client already has a user account
    if (client.user_id) {
      return new Response(
        JSON.stringify({ error: 'Client already has an account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Email is required for invite
    if (!client.email) {
      return new Response(
        JSON.stringify({ error: 'Client does not have an email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Revoke any existing pending invites for this client
    const { error: revokeError } = await supabaseAdmin
      .from('client_invites')
      .update({ status: 'revoked' })
      .eq('client_id', clientId)
      .eq('status', 'pending');

    if (revokeError) {
      console.warn('Error revoking old invites (non-fatal):', revokeError);
    }

    // Create new invite
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('client_invites')
      .insert({
        coach_id: coachId,
        client_id: clientId,
        email: client.email,
        expires_at: expiresAt.toISOString(),
      })
      .select('id, token, expires_at')
      .single();

    if (inviteError || !invite) {
      console.error('Error creating invite:', inviteError);
      return new Response(
        JSON.stringify({ error: inviteError?.message || 'Failed to create invite' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Invite created with token: ${invite.token}`);

    // Build invite link
    const appUrl = Deno.env.get('APP_URL') || 'https://qadgzwsmiadxwwvsrauz.lovable.app';
    const inviteLink = `${appUrl}/client/accept-invite?token=${invite.token}`;

    // Queue invite email via Email Outbox Pattern
    try {
      await queueEmail(supabaseAdmin, {
        type: 'client_invite',
        toEmail: client.email,
        recipientUserId: null, // Client non ha ancora user_id
        senderUserId: coachId,
        templateData: {
          client_first_name: client.first_name,
          client_last_name: client.last_name,
          invite_link: inviteLink,
          expires_at: invite.expires_at,
        },
      });
      console.log(`Email queued for client invite: ${client.email}`);
    } catch (emailError) {
      console.warn('Failed to queue invite email (non-fatal):', emailError);
      // Non blocchiamo - l'email può essere re-inviata dalla scheda cliente
    }

    return new Response(
      JSON.stringify({
        success: true,
        inviteLink,
        expiresAt: invite.expires_at,
        clientName: `${client.first_name} ${client.last_name}`,
        email: client.email,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
