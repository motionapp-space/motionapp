import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { queueEmail, EmailType } from "../_shared/email-outbox.ts";
import { buildTemplateData } from "../_shared/email-template-data.ts";
import type { BookingEmailSnapshot as SharedSnapshot } from "../_shared/email-snapshots/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Snapshot contract - contiene TUTTI i dati per l'email.
 * Nessuna query al DB necessaria - questa funzione è un puro adapter.
 */
interface BookingEmailSnapshot {
  event_id?: string;
  booking_request_id?: string;
  title?: string;
  start_at: string;
  end_at: string;
  original_start_at?: string;
  original_end_at?: string;
  proposed_start_at?: string;
  proposed_end_at?: string;
  notes?: string;
  coach_user_id: string;
  coach_name: string;
  coach_email: string;
  client_user_id?: string;
  client_name: string;
  client_email: string;
  actor_role: 'coach' | 'client';
}

type BookingEmailType =
  | 'appointment_request_created'
  | 'appointment_accepted'
  | 'appointment_counter_proposed'
  | 'appointment_cancelled';

interface QueueBookingEmailRequest {
  type: BookingEmailType;
  actorUserId: string;
  snapshot: BookingEmailSnapshot;
}

/**
 * Campi minimi richiesti per ogni tipo di email.
 * Se mancano, la funzione restituisce errore esplicito.
 */
const REQUIRED_FIELDS: Record<BookingEmailType, (keyof BookingEmailSnapshot)[]> = {
  appointment_request_created: ['start_at', 'end_at', 'coach_email', 'client_name', 'coach_user_id'],
  appointment_accepted: ['start_at', 'end_at', 'client_email', 'client_name', 'coach_name'],
  appointment_counter_proposed: ['original_start_at', 'original_end_at', 'proposed_start_at', 'proposed_end_at', 'client_email', 'client_name', 'coach_name'],
  appointment_cancelled: ['start_at', 'end_at', 'client_name', 'actor_role', 'coach_email', 'client_email'],
};

function validateSnapshot(type: BookingEmailType, snapshot: BookingEmailSnapshot): void {
  const required = REQUIRED_FIELDS[type] || [];
  const missing = required.filter(field => snapshot[field] === undefined || snapshot[field] === null || snapshot[field] === '');
  
  if (missing.length > 0) {
    throw new Error(`Missing required snapshot fields for ${type}: ${missing.join(', ')}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: QueueBookingEmailRequest = await req.json();
    const { type, actorUserId, snapshot } = body;

    // Validazione input
    if (!type || !actorUserId) {
      console.error('[queue-booking-email] Missing type or actorUserId');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type and actorUserId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!snapshot) {
      console.error('[queue-booking-email] Missing snapshot - this is required');
      return new Response(
        JSON.stringify({ error: 'Missing required field: snapshot is required. The caller must provide all email data.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validazione snapshot per tipo - errore esplicito se incompleto
    try {
      validateSnapshot(type, snapshot);
    } catch (validationError) {
      console.error('[queue-booking-email] Snapshot validation failed:', validationError);
      return new Response(
        JSON.stringify({ error: validationError instanceof Error ? validationError.message : 'Invalid snapshot' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Determina destinatario basandosi su actor_role e tipo
    let recipientEmail: string;
    let recipientUserId: string | null;
    let senderUserId: string;

    if (type === 'appointment_request_created') {
      // Client ha creato richiesta → email a coach
      recipientEmail = snapshot.coach_email;
      recipientUserId = snapshot.coach_user_id;
      senderUserId = snapshot.client_user_id || actorUserId;
    } else if (snapshot.actor_role === 'client') {
      // Client agisce (cancella, rifiuta) → email a coach
      recipientEmail = snapshot.coach_email;
      recipientUserId = snapshot.coach_user_id;
      senderUserId = snapshot.client_user_id || actorUserId;
    } else {
      // Coach agisce (approva, contropropone, cancella) → email a client
      recipientEmail = snapshot.client_email;
      recipientUserId = snapshot.client_user_id || null;
      senderUserId = actorUserId;
    }

    // Costruisci template_data usando helper condiviso per formato uniforme
    const snapshotForTemplate: SharedSnapshot = {
      event_id: snapshot.event_id,
      booking_request_id: snapshot.booking_request_id,
      title: snapshot.title,
      start_at: snapshot.start_at,
      end_at: snapshot.end_at,
      original_start_at: snapshot.original_start_at,
      original_end_at: snapshot.original_end_at,
      proposed_start_at: snapshot.proposed_start_at,
      proposed_end_at: snapshot.proposed_end_at,
      notes: snapshot.notes,
      coach_user_id: snapshot.coach_user_id,
      coach_name: snapshot.coach_name,
      coach_email: snapshot.coach_email,
      client_user_id: snapshot.client_user_id,
      client_name: snapshot.client_name,
      client_email: snapshot.client_email,
      actor_role: snapshot.actor_role,
    };
    const templateData = buildTemplateData(type as EmailType, snapshotForTemplate);

    // Accoda email
    const result = await queueEmail(supabaseAdmin, {
      type: type as EmailType,
      toEmail: recipientEmail,
      recipientUserId,
      senderUserId,
      templateData,
    });

    console.log(`[queue-booking-email] Queued ${type} email:`, {
      id: result.id,
      to: recipientEmail,
      eventId: snapshot.event_id,
      requestId: snapshot.booking_request_id,
      actorRole: snapshot.actor_role,
    });

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[queue-booking-email] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
