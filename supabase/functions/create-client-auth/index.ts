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
    const { email, password, clientId } = await req.json();

    if (!email || !password || !clientId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, clientId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    console.log(`Creating auth user for email: ${email}, clientId: ${clientId}`);

    // Fetch client data to populate users table
    const { data: clientData, error: clientFetchError } = await supabaseAdmin
      .from('clients')
      .select('first_name, last_name, email')
      .eq('id', clientId)
      .single();

    if (clientFetchError || !clientData) {
      console.error('Error fetching client data:', clientFetchError);
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Auth user created with id: ${authData.user.id}`);

    // Insert into public.users table (Unified Identity)
    const { error: usersError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        first_name: clientData.first_name,
        last_name: clientData.last_name,
      });

    if (usersError) {
      console.error('Error creating users record:', usersError);
      // Clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: usersError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Users record created for: ${authData.user.id}`);

    // Assign 'client' role in user_roles table
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'client',
      });

    if (roleError) {
      console.error('Error assigning role:', roleError);
      // Clean up: delete users record and auth user
      await supabaseAdmin.from('users').delete().eq('id', authData.user.id);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: roleError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Role 'client' assigned to user: ${authData.user.id}`);

    // Update the client record with user_id only (auth_user_id column removed)
    const { error: updateError } = await supabaseAdmin
      .from('clients')
      .update({ 
        user_id: authData.user.id 
      })
      .eq('id', clientId);

    if (updateError) {
      console.error('Error updating client:', updateError);
      // Clean up everything
      await supabaseAdmin.from('user_roles').delete().eq('user_id', authData.user.id);
      await supabaseAdmin.from('users').delete().eq('id', authData.user.id);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Client ${clientId} updated with user_id: ${authData.user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        authUserId: authData.user.id,
        message: `Auth credentials created for ${email}` 
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
