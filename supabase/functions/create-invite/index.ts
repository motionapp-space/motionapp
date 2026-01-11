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

    // Send invitation email via Resend
    let emailSent = false;
    let emailError: string | null = null;
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        const expiresFormatted = new Date(invite.expires_at).toLocaleDateString('it-IT', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

        const { error: sendError } = await resend.emails.send({
          from: 'FitCoach <onboarding@resend.dev>',
          to: [client.email],
          subject: '🎉 Sei stato invitato a FitCoach!',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">FitCoach</h1>
                        </td>
                      </tr>
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px 32px;">
                          <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 24px; font-weight: 600;">
                            Ciao ${client.first_name}! 👋
                          </h2>
                          <p style="margin: 0 0 24px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
                            Il tuo coach ti ha invitato a unirti alla piattaforma <strong>FitCoach</strong>. 
                            Crea il tuo account per accedere ai tuoi programmi di allenamento e gestire le tue prenotazioni.
                          </p>
                          
                          <!-- CTA Button -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                            <tr>
                              <td align="center">
                                <a href="${inviteLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);">
                                  Crea il tuo account
                                </a>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="margin: 0 0 8px 0; color: #71717a; font-size: 14px;">
                            Oppure copia e incolla questo link nel tuo browser:
                          </p>
                          <p style="margin: 0 0 24px 0; color: #6366f1; font-size: 14px; word-break: break-all;">
                            ${inviteLink}
                          </p>
                          
                          <!-- Expiry Notice -->
                          <div style="padding: 16px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                            <p style="margin: 0; color: #92400e; font-size: 14px;">
                              ⏰ <strong>Nota:</strong> Questo link scadrà il ${expiresFormatted}
                            </p>
                          </div>
                        </td>
                      </tr>
                      <!-- Footer -->
                      <tr>
                        <td style="padding: 24px 32px; background-color: #f4f4f5; text-align: center;">
                          <p style="margin: 0; color: #71717a; font-size: 12px;">
                            Se non hai richiesto questo invito, puoi ignorare questa email.
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

        if (sendError) {
          console.error('Email send failed:', sendError);
          emailError = sendError.message;
        } else {
          emailSent = true;
          console.log(`Invitation email sent to ${client.email}`);
        }
      } catch (err) {
        console.error('Email send error:', err);
        emailError = err instanceof Error ? err.message : 'Unknown email error';
      }
    } else {
      console.warn('RESEND_API_KEY not configured, skipping email');
      emailError = 'Email service not configured';
    }

    return new Response(
      JSON.stringify({
        success: true,
        inviteLink,
        expiresAt: invite.expires_at,
        clientName: `${client.first_name} ${client.last_name}`,
        email: client.email,
        emailSent,
        emailError,
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
