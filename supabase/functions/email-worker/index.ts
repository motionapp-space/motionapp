/**
 * Email Worker Edge Function
 * 
 * Processa la coda email_messages e invia email tramite Resend.
 * Utilizza i template esistenti in _shared/emails/.
 * 
 * Autenticazione: richiede header x-worker-secret
 * Invocazione: POST senza body
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import { renderEmail } from "../_shared/emails/renderer.ts";

// CORS headers (per eventuali chiamate da browser in dev)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-worker-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Configurazione
const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 3;
const FROM_EMAIL = Deno.env.get("EMAIL_FROM") || "Motion <noreply@motion.app>";

interface EmailMessage {
  id: string;
  type: string;
  to_email: string;
  template_data: Record<string, unknown>;
  attempt_count: number;
  scheduled_at: string;
}

interface ProcessResult {
  id: string;
  status: 'sent' | 'failed' | 'error';
  to: string;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Solo POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verifica autenticazione worker
  const workerSecret = Deno.env.get("WORKER_SECRET");
  const providedSecret = req.headers.get("x-worker-secret");

  if (!workerSecret || providedSecret !== workerSecret) {
    console.error("[email-worker] Unauthorized: invalid or missing x-worker-secret");
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Inizializza client
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("[email-worker] RESEND_API_KEY not configured");
    return new Response(
      JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  const resend = new Resend(resendApiKey);

  console.log("[email-worker] Starting email processing...");

  // Query email pending
  const { data: pendingEmails, error: queryError } = await supabase
    .from('email_messages')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (queryError) {
    console.error("[email-worker] Query error:", queryError);
    return new Response(
      JSON.stringify({ error: 'Failed to query pending emails', details: queryError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!pendingEmails || pendingEmails.length === 0) {
    console.log("[email-worker] No pending emails to process");
    return new Response(
      JSON.stringify({ processed: 0, sent: 0, failed: 0, details: [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`[email-worker] Found ${pendingEmails.length} pending emails`);

  const results: ProcessResult[] = [];
  let sentCount = 0;
  let failedCount = 0;

  // Processa ogni email
  for (const email of pendingEmails as EmailMessage[]) {
    console.log(`[email-worker] Processing email ${email.id} (type: ${email.type}, to: ${email.to_email})`);

    try {
      // 1. Renderizza email usando il renderer esistente
      const { subject, html } = await renderEmail({
        type: email.type,
        template_data: email.template_data,
      });

      console.log(`[email-worker] Rendered email ${email.id}: subject="${subject}"`);

      // 2. Invia tramite Resend
      const { data: sendResult, error: sendError } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [email.to_email],
        subject,
        html,
      });

      if (sendError) {
        throw new Error(sendError.message || 'Resend send failed');
      }

      console.log(`[email-worker] Email ${email.id} sent successfully, provider_id: ${sendResult?.id}`);

      // 3. Update successo
      const { error: updateError } = await supabase
        .from('email_messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider_message_id: sendResult?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', email.id);

      if (updateError) {
        console.error(`[email-worker] Failed to update email ${email.id} as sent:`, updateError);
      }

      results.push({ id: email.id, status: 'sent', to: email.to_email });
      sentCount++;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[email-worker] Error processing email ${email.id}:`, errorMessage);

      // Update errore
      const newAttemptCount = email.attempt_count + 1;
      const isFailed = newAttemptCount >= MAX_ATTEMPTS;

      const updateData: Record<string, unknown> = {
        attempt_count: newAttemptCount,
        last_error: errorMessage,
        updated_at: new Date().toISOString(),
      };

      if (isFailed) {
        updateData.status = 'failed';
        updateData.failed_at = new Date().toISOString();
        console.log(`[email-worker] Email ${email.id} marked as failed after ${newAttemptCount} attempts`);
      } else {
        console.log(`[email-worker] Email ${email.id} will retry (attempt ${newAttemptCount}/${MAX_ATTEMPTS})`);
      }

      const { error: updateError } = await supabase
        .from('email_messages')
        .update(updateData)
        .eq('id', email.id);

      if (updateError) {
        console.error(`[email-worker] Failed to update email ${email.id} error state:`, updateError);
      }

      results.push({
        id: email.id,
        status: isFailed ? 'failed' : 'error',
        to: email.to_email,
        error: errorMessage,
      });

      if (isFailed) {
        failedCount++;
      }
    }
  }

  const response = {
    processed: pendingEmails.length,
    sent: sentCount,
    failed: failedCount,
    details: results,
  };

  console.log(`[email-worker] Completed: processed=${response.processed}, sent=${sentCount}, failed=${failedCount}`);

  return new Response(
    JSON.stringify(response),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
