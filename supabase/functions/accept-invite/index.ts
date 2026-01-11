import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: token, password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing invite acceptance for token: ${token.substring(0, 8)}...`);

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Find and validate the invite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('client_invites')
      .select(`
        id,
        email,
        status,
        expires_at,
        client_id,
        coach_id,
        clients (
          id,
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
        JSON.stringify({ error: 'Invalid invite token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check status
    if (invite.status !== 'pending') {
      return new Response(
        JSON.stringify({ 
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
      await supabaseAdmin
        .from('client_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id);

      return new Response(
        JSON.stringify({ error: 'This invite has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const client = invite.clients as unknown as { id: string; first_name: string; last_name: string; user_id: string | null } | null;
    
    if (!client) {
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if client already has account
    if (client.user_id) {
      return new Response(
        JSON.stringify({ error: 'An account already exists for this client' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating account for: ${client.first_name} ${client.last_name} (${invite.email})`);

    // Check if auth user already exists (from a previous failed attempt)
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === invite.email.toLowerCase());
    
    let authUserId: string;
    
    if (existingAuthUser) {
      console.log(`Auth user already exists: ${existingAuthUser.id}, reusing...`);
      authUserId = existingAuthUser.id;
      
      // Update the password for the existing user
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        password,
        email_confirm: true,
      });
      
      if (updateError) {
        console.error('Error updating existing auth user:', updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Create new auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: invite.email,
        password,
        email_confirm: true,
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      authUserId = authData.user.id;
    }
    
    console.log(`Auth user ID: ${authUserId}`);

    console.log(`Using auth user: ${authUserId}`);

    // Helper for cleanup
    const cleanup = async () => {
      await supabaseAdmin.from('user_roles').delete().eq('user_id', authUserId);
      await supabaseAdmin.from('users').delete().eq('id', authUserId);
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
    };

    // Create or update users record (Unified Identity)
    const { error: usersError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authUserId,
        email: invite.email,
        first_name: client.first_name,
        last_name: client.last_name,
      }, { onConflict: 'id' });

    if (usersError) {
      console.error('Error creating/updating users record:', usersError);
      await cleanup();
      return new Response(
        JSON.stringify({ error: usersError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Users record ensured for: ${authUserId}`);

    // Assign client role (upsert to handle retry scenarios)
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: authUserId,
        role: 'client',
      }, { onConflict: 'user_id,role', ignoreDuplicates: true });

    if (roleError && !roleError.message.includes('duplicate')) {
      console.error('Error assigning role:', roleError);
      await cleanup();
      return new Response(
        JSON.stringify({ error: roleError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Role 'client' ensured for: ${authUserId}`);

    // Update client record
    const { error: clientUpdateError } = await supabaseAdmin
      .from('clients')
      .update({
        user_id: authUserId,
        status: 'ATTIVO',
        last_access_at: new Date().toISOString(),
      })
      .eq('id', invite.client_id);

    if (clientUpdateError) {
      console.error('Error updating client:', clientUpdateError);
      await cleanup();
      return new Response(
        JSON.stringify({ error: clientUpdateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Client ${invite.client_id} updated with user_id`);

    // Update coach_clients relationship
    const { error: ccUpdateError } = await supabaseAdmin
      .from('coach_clients')
      .update({ status: 'active' })
      .eq('client_id', invite.client_id)
      .eq('coach_id', invite.coach_id);

    if (ccUpdateError) {
      console.warn('Error updating coach_clients (non-fatal):', ccUpdateError);
    }

    console.log(`Coach-client relationship updated to active`);

    // Mark invite as accepted
    const { error: inviteUpdateError } = await supabaseAdmin
      .from('client_invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite.id);

    if (inviteUpdateError) {
      console.warn('Error updating invite status (non-fatal):', inviteUpdateError);
    }

    console.log(`Invite ${invite.id} marked as accepted`);

    // Send confirmation email via Resend
    const appUrl = Deno.env.get('APP_URL') || 'https://qadgzwsmiadxwwvsrauz.lovable.app';
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        await resend.emails.send({
          from: 'Studio AI <onboarding@resend.dev>',
          to: [invite.email],
          subject: 'Account Studio AI attivato con successo',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #eef0f3;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eef0f3; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #fcfcfc; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #2db875 0%, #22a066 100%); padding: 32px; text-align: center;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; font-family: 'Montserrat', sans-serif;">Benvenuto su Studio AI!</h1>
                        </td>
                      </tr>
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px 32px;">
                          <h2 style="margin: 0 0 16px 0; color: #2d3340; font-size: 24px; font-weight: 600; font-family: 'Montserrat', sans-serif;">
                            Ciao ${client.first_name}!
                          </h2>
                          <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.6; font-family: 'Montserrat', sans-serif;">
                            Il tuo account su <strong style="color: #2d3340;">Studio AI</strong> è stato attivato con successo! 
                            Ora puoi accedere alla piattaforma per visualizzare i tuoi programmi di allenamento e gestire le tue prenotazioni.
                          </p>
                          
                          <!-- Success Badge -->
                          <div style="margin: 24px 0; padding: 20px; background-color: #f0fdf4; border-radius: 12px; border-left: 4px solid #2db875; text-align: center;">
                            <p style="margin: 0; color: #166534; font-size: 18px; font-weight: 600; font-family: 'Montserrat', sans-serif;">
                              Account attivo
                            </p>
                            <p style="margin: 8px 0 0 0; color: #15803d; font-size: 14px; font-family: 'Montserrat', sans-serif;">
                              Email: ${invite.email}
                            </p>
                          </div>
                          
                          <!-- CTA Button -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                            <tr>
                              <td align="center">
                                <a href="${appUrl}/client/auth" style="display: inline-block; padding: 16px 32px; background-color: #2264d1; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; font-family: 'Montserrat', sans-serif;">
                                  Accedi alla piattaforma
                                </a>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center; font-family: 'Montserrat', sans-serif;">
                            Usa la tua email e la password che hai appena creato per accedere.
                          </p>
                        </td>
                      </tr>
                      <!-- Footer -->
                      <tr>
                        <td style="padding: 24px 32px; background-color: #eef0f3; text-align: center;">
                          <p style="margin: 0; color: #6b7280; font-size: 12px; font-family: 'Montserrat', sans-serif;">
                            Hai bisogno di aiuto? Contatta il tuo coach.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
        });
        
        console.log(`Confirmation email sent to ${invite.email}`);
      } catch (emailErr) {
        console.error('Confirmation email failed (non-fatal):', emailErr);
      }
    } else {
      console.warn('RESEND_API_KEY not configured, skipping confirmation email');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account created successfully',
        email: invite.email,
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
