import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidateInviteRequest {
  code: string;
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
    const { code }: ValidateInviteRequest = await req.json();

    // Validate required fields
    if (!code || typeof code !== "string" || code.trim() === "") {
      return new Response(
        JSON.stringify({ valid: false, error: "Codice invito mancante" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[validate-coach-invite] Validating code: ${code}`);

    // Fetch invite by code
    const { data: invite, error: fetchError } = await supabaseAdmin
      .from("coach_invites")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .single();

    if (fetchError || !invite) {
      console.log(`[validate-coach-invite] Invite not found: ${code}`);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Codice invito non valido. Contatta l'amministratore." 
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    if (expiresAt <= now) {
      console.log(`[validate-coach-invite] Invite expired: ${code}`);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Questo invito è scaduto. Contatta l'amministratore per un nuovo invito." 
        }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already used
    if (invite.used_count >= invite.max_uses) {
      console.log(`[validate-coach-invite] Invite already used: ${code}`);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Questo invito è già stato utilizzato." 
        }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[validate-coach-invite] Invite valid: ${code}`);

    // Success response
    return new Response(
      JSON.stringify({
        valid: true,
        expiresAt: invite.expires_at,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[validate-coach-invite] Unexpected error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Errore durante la validazione dell'invito";
    
    return new Response(
      JSON.stringify({ 
        valid: false,
        error: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
