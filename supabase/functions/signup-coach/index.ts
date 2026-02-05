import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignupCoachRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string | null;
  invite_code: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Parse request body
    const { email, password, first_name, last_name, invite_code }: SignupCoachRequest = await req.json();

    // Validate required fields
    if (!email || !password || !first_name) {
      return new Response(
        JSON.stringify({ error: "Email, password e nome sono obbligatori" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate invite code is present
    if (!invite_code || typeof invite_code !== "string" || invite_code.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Codice invito obbligatorio per la registrazione" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password strength (minimum requirements)
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "La password deve essere di almeno 8 caratteri" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedCode = invite_code.trim().toUpperCase();
    console.log(`[signup-coach] Validating invite code: ${normalizedCode}`);

    // Step 0: Validate invite code
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("coach_invites")
      .select("*")
      .eq("code", normalizedCode)
      .single();

    if (inviteError || !invite) {
      console.log(`[signup-coach] Invite not found: ${normalizedCode}`);
      return new Response(
        JSON.stringify({ error: "Codice invito non valido. Contatta l'amministratore." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    if (expiresAt <= now) {
      console.log(`[signup-coach] Invite expired: ${normalizedCode}`);
      return new Response(
        JSON.stringify({ error: "Questo invito è scaduto. Contatta l'amministratore per un nuovo invito." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already used
    if (invite.used_count >= invite.max_uses) {
      console.log(`[signup-coach] Invite already used: ${normalizedCode}`);
      return new Response(
        JSON.stringify({ error: "Questo invito è già stato utilizzato." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[signup-coach] Invite valid, creating coach account for: ${email}`);

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        is_coach: true,
      },
    });

    if (authError) {
      console.error("[signup-coach] Auth error:", authError);
      
      // Handle duplicate email
      if (authError.message?.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "Questa email è già registrata" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw authError;
    }

    if (!authData.user) {
      throw new Error("User creation failed - no user returned");
    }

    const userId = authData.user.id;
    console.log(`[signup-coach] Auth user created: ${userId}`);

    // Step 2: Create coaches record
    const { error: coachError } = await supabaseAdmin
      .from("coaches")
      .insert({ id: userId });

    if (coachError) {
      console.error("[signup-coach] Coach insert error:", coachError);
      
      // Cleanup: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      console.log(`[signup-coach] Cleanup: deleted auth user ${userId}`);
      
      throw coachError;
    }

    console.log(`[signup-coach] Coach record created for: ${userId}`);

    // Step 3: Assign coach role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "coach" });

    if (roleError) {
      console.error("[signup-coach] Role insert error:", roleError);
      
      // Cleanup: delete coach and auth user
      await supabaseAdmin.from("coaches").delete().eq("id", userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      console.log(`[signup-coach] Cleanup: deleted coach and auth user ${userId}`);
      
      throw roleError;
    }

    console.log(`[signup-coach] Coach role assigned for: ${userId}`);

    // Step 4: Create default single_session product
    const { error: productError } = await supabaseAdmin
      .from("products")
      .insert({
        coach_id: userId,
        name: "Lezione singola",
        type: "single_session",
        credits_amount: 1,
        price_cents: 5000, // Default 50€
        duration_months: 12,
        is_active: true,
        is_visible: true,
        sort_order: 0,
      });

    if (productError) {
      // Log ma non bloccare - indice UNIQUE impedisce duplicati
      // Frontend gestira creazione se necessario
      console.warn("[signup-coach] Default product creation failed:", productError.message);
    } else {
      console.log(`[signup-coach] Default single_session product created for: ${userId}`);
    }

    // Step 5: Increment used_count (only after everything succeeded)
    const { error: updateError } = await supabaseAdmin
      .from("coach_invites")
      .update({ used_count: invite.used_count + 1 })
      .eq("id", invite.id);

    if (updateError) {
      console.error("[signup-coach] Failed to increment invite used_count:", updateError);
      // Don't fail the signup - coach is already created
      // Just log the error for monitoring
    } else {
      console.log(`[signup-coach] Invite ${normalizedCode} used_count incremented`);
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email: authData.user.email,
        },
        message: "Account coach creato con successo",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[signup-coach] Unexpected error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Errore durante la creazione dell'account";
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
