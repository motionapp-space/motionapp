import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { queueEmail } from "../_shared/email-outbox.ts";
import { 
  buildEventSnapshot, 
  buildBookingRequestSnapshot,
  type BookingEmailSnapshot 
} from "../_shared/email-snapshots/index.ts";
import { 
  type ClientActionType, 
  getEmailTypeForAction 
} from "../_shared/action-email-mapping.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActionRequest {
  action: ClientActionType;
  eventId?: string;
  bookingRequestId?: string;
  coachClientId?: string;
  requestData?: {
    requestedStartAt: string;
    requestedEndAt: string;
    notes?: string;
    economicType: string;
    packageId?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validate auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[client-appointment-actions] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[client-appointment-actions] User authenticated: ${user.id}`);

    // Get client profile
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      console.error('[client-appointment-actions] Client not found:', clientError);
      return new Response(
        JSON.stringify({ error: 'Client profile not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ActionRequest = await req.json();
    const { action, eventId, bookingRequestId, coachClientId, requestData } = body;

    console.log(`[client-appointment-actions] Action: ${action}, eventId: ${eventId}, requestId: ${bookingRequestId}`);

    let snapshot: BookingEmailSnapshot | null = null;
    let result: unknown = null;

    switch (action) {
      case 'cancel_appointment': {
        if (!eventId) throw new Error('eventId required for cancel_appointment');

        // Verify client owns this event
        const { data: event, error: eventCheckError } = await supabaseAdmin
          .from('events')
          .select('coach_client_id, coach_clients!inner(client_id)')
          .eq('id', eventId)
          .single();

        if (eventCheckError || !event) throw new Error('Event not found');
        
        const eventCoachClients = event.coach_clients as unknown as { client_id: string };
        if (eventCoachClients.client_id !== client.id) {
          throw new Error('Not authorized for this appointment');
        }

        // 1. Build snapshot server-side BEFORE mutation
        snapshot = await buildEventSnapshot(supabaseAdmin, eventId, 'client');

        // 2. Execute cancel via RPC
        const { data: cancelData, error: cancelError } = await supabaseAdmin.rpc('cancel_event_with_ledger', {
          p_event_id: eventId,
          p_actor: 'client'
        });

        if (cancelError) throw new Error(cancelError.message);
        if (cancelData?.error) throw new Error(String(cancelData.error));

        result = cancelData;
        break;
      }

      case 'reject_change_proposal': {
        if (!eventId) throw new Error('eventId required for reject_change_proposal');

        // Verify client owns this event
        const { data: event, error: eventCheckError } = await supabaseAdmin
          .from('events')
          .select('coach_client_id, coach_clients!inner(client_id)')
          .eq('id', eventId)
          .single();

        if (eventCheckError || !event) throw new Error('Event not found');
        
        const eventCoachClients = event.coach_clients as unknown as { client_id: string };
        if (eventCoachClients.client_id !== client.id) {
          throw new Error('Not authorized for this appointment');
        }

        // 1. Build snapshot server-side BEFORE mutation
        snapshot = await buildEventSnapshot(supabaseAdmin, eventId, 'client');

        // 2. Cancel via RPC
        const { data: cancelData, error: cancelError } = await supabaseAdmin.rpc('cancel_event_with_ledger', {
          p_event_id: eventId,
          p_actor: 'client'
        });

        if (cancelError) throw new Error(cancelError.message);
        if (cancelData?.error) throw new Error(String(cancelData.error));

        // 3. Reset proposal fields
        await supabaseAdmin
          .from('events')
          .update({
            proposed_start_at: null,
            proposed_end_at: null,
            proposal_status: null
          })
          .eq('id', eventId);

        result = cancelData;
        break;
      }

      case 'cancel_booking_request': {
        if (!bookingRequestId) throw new Error('bookingRequestId required for cancel_booking_request');

        // Verify client owns this request
        const { data: request, error: reqCheckError } = await supabaseAdmin
          .from('booking_requests')
          .select('coach_client_id, coach_clients!inner(client_id)')
          .eq('id', bookingRequestId)
          .single();

        if (reqCheckError || !request) throw new Error('Booking request not found');
        
        const reqCoachClients = request.coach_clients as unknown as { client_id: string };
        if (reqCoachClients.client_id !== client.id) {
          throw new Error('Not authorized for this booking request');
        }

        // 1. Build snapshot server-side BEFORE mutation
        snapshot = await buildBookingRequestSnapshot(supabaseAdmin, bookingRequestId, 'client');

        // 2. Update status
        const { error: updateError } = await supabaseAdmin
          .from('booking_requests')
          .update({ status: 'CANCELED_BY_CLIENT' })
          .eq('id', bookingRequestId);

        if (updateError) throw new Error(updateError.message);
        break;
      }

      case 'reject_counter_proposal': {
        if (!bookingRequestId) throw new Error('bookingRequestId required for reject_counter_proposal');

        // Verify client owns this request
        const { data: request, error: reqCheckError } = await supabaseAdmin
          .from('booking_requests')
          .select('coach_client_id, coach_clients!inner(client_id)')
          .eq('id', bookingRequestId)
          .single();

        if (reqCheckError || !request) throw new Error('Booking request not found');
        
        const reqCoachClients = request.coach_clients as unknown as { client_id: string };
        if (reqCoachClients.client_id !== client.id) {
          throw new Error('Not authorized for this booking request');
        }

        // 1. Build snapshot server-side BEFORE mutation
        snapshot = await buildBookingRequestSnapshot(supabaseAdmin, bookingRequestId, 'client');

        // 2. Update status
        const { error: updateError } = await supabaseAdmin
          .from('booking_requests')
          .update({ status: 'CANCELED_BY_CLIENT' })
          .eq('id', bookingRequestId);

        if (updateError) throw new Error(updateError.message);
        break;
      }

      case 'create_booking_request': {
        if (!coachClientId || !requestData) {
          throw new Error('coachClientId and requestData required for create_booking_request');
        }

        // Verify client owns this coach_client relationship
        const { data: cc, error: ccError } = await supabaseAdmin
          .from('coach_clients')
          .select('client_id')
          .eq('id', coachClientId)
          .single();

        if (ccError || !cc) throw new Error('Coach-client relationship not found');
        if (cc.client_id !== client.id) {
          throw new Error('Not authorized for this coach-client relationship');
        }

        // 1. Insert booking request
        const { data: newRequest, error: insertError } = await supabaseAdmin
          .from('booking_requests')
          .insert({
            coach_client_id: coachClientId,
            requested_start_at: requestData.requestedStartAt,
            requested_end_at: requestData.requestedEndAt,
            notes: requestData.notes || null,
            status: 'PENDING',
            economic_type: requestData.economicType,
            selected_package_id: requestData.economicType === 'package' ? requestData.packageId : null,
          })
          .select('id')
          .single();

        if (insertError) throw new Error(insertError.message);

        // 2. Build snapshot from newly created request
        snapshot = await buildBookingRequestSnapshot(supabaseAdmin, newRequest.id, 'client');

        result = { id: newRequest.id };
        break;
      }

      case 'accept_counter_proposal': {
        if (!bookingRequestId) throw new Error('bookingRequestId required for accept_counter_proposal');

        // Verify client owns this request
        const { data: request, error: reqCheckError } = await supabaseAdmin
          .from('booking_requests')
          .select('coach_client_id, coach_clients!inner(client_id)')
          .eq('id', bookingRequestId)
          .single();

        if (reqCheckError || !request) throw new Error('Booking request not found');
        
        const reqCoachClients = request.coach_clients as unknown as { client_id: string };
        if (reqCoachClients.client_id !== client.id) {
          throw new Error('Not authorized for this booking request');
        }

        // 1. Build snapshot BEFORE finalization
        snapshot = await buildBookingRequestSnapshot(supabaseAdmin, bookingRequestId, 'client');

        // 2. Finalize via RPC
        const { data: eventId, error: finalizeError } = await supabaseAdmin.rpc('finalize_booking_request', {
          p_request_id: bookingRequestId
        });

        if (finalizeError) {
          throw new Error(finalizeError.message === 'Slot non disponibile' 
            ? 'Slot non disponibile' 
            : finalizeError.message);
        }

        result = { event_id: eventId };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // 3. Queue email usando la mappa action → email_type
    const emailType = getEmailTypeForAction(action);
    if (emailType && snapshot) {
      // Determine recipient based on actor role
      const recipientEmail = snapshot.actor_role === 'client' 
        ? snapshot.coach_email 
        : snapshot.client_email;
      const recipientUserId = snapshot.actor_role === 'client'
        ? snapshot.coach_user_id
        : snapshot.client_user_id;
      const senderUserId = snapshot.actor_role === 'client'
        ? snapshot.client_user_id
        : snapshot.coach_user_id;

      console.log(`[client-appointment-actions] Queueing email: type=${emailType}, to=${recipientEmail}`);

      await queueEmail(supabaseAdmin, {
        type: emailType,
        toEmail: recipientEmail,
        recipientUserId: recipientUserId ?? null,
        senderUserId: senderUserId ?? null,
        templateData: {
          ...snapshot,
          // Add context for cancelled emails
          ...(emailType === 'appointment_cancelled' ? { cancelled_by: snapshot.actor_role } : {})
        }
      });

      console.log(`[client-appointment-actions] Email queued successfully`);
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[client-appointment-actions] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
