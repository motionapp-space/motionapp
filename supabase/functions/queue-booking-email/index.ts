import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { queueEmail, EmailType } from "../_shared/email-outbox.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueueBookingEmailRequest {
  type: 'request_created' | 'accepted' | 'counter_proposed' | 'cancelled';
  bookingRequestId?: string;
  eventId?: string;
  actorUserId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: QueueBookingEmailRequest = await req.json();
    const { type, bookingRequestId, eventId, actorUserId } = body;

    // Validate required fields
    if (!type || !actorUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type and actorUserId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!bookingRequestId && !eventId) {
      return new Response(
        JSON.stringify({ error: 'Either bookingRequestId or eventId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let emailType: EmailType;
    let recipientEmail: string;
    let recipientUserId: string | null;
    let senderUserId: string;
    let templateData: Record<string, unknown>;

    // Handle different email types
    if (type === 'request_created' && bookingRequestId) {
      // Client created a booking request → email to coach
      const { data: request, error: reqError } = await supabaseAdmin
        .from('booking_requests')
        .select(`
          id, requested_start_at, requested_end_at, notes,
          coach_clients!inner(
            coach_id,
            clients!inner(first_name, last_name, user_id)
          )
        `)
        .eq('id', bookingRequestId)
        .single();

      if (reqError || !request) {
        console.error('Booking request not found:', reqError);
        throw new Error('Booking request not found');
      }

      const cc = request.coach_clients as any;
      const client = cc.clients;

      // Get coach email from users table
      const { data: coachUser, error: coachError } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', cc.coach_id)
        .single();

      if (coachError || !coachUser?.email) {
        throw new Error('Coach email not found');
      }

      emailType = 'appointment_request_created';
      recipientEmail = coachUser.email;
      recipientUserId = cc.coach_id;
      senderUserId = client.user_id;
      templateData = {
        client_name: `${client.first_name} ${client.last_name}`,
        requested_start_at: request.requested_start_at,
        requested_end_at: request.requested_end_at,
        notes: request.notes ?? '',
      };
    } 
    else if (type === 'accepted' && bookingRequestId) {
      // Coach accepted → email to client
      const { data: request, error: reqError } = await supabaseAdmin
        .from('booking_requests')
        .select(`
          id, finalized_start_at, finalized_end_at, requested_start_at, requested_end_at,
          coach_clients!inner(
            coach_id,
            clients!inner(first_name, last_name, email, user_id)
          )
        `)
        .eq('id', bookingRequestId)
        .single();

      if (reqError || !request) {
        throw new Error('Booking request not found');
      }

      const cc = request.coach_clients as any;
      const client = cc.clients;

      if (!client.email) {
        throw new Error('Client email not found');
      }

      emailType = 'appointment_accepted';
      recipientEmail = client.email;
      recipientUserId = client.user_id;
      senderUserId = actorUserId; // Coach
      templateData = {
        client_name: `${client.first_name} ${client.last_name}`,
        appointment_start_at: request.finalized_start_at ?? request.requested_start_at,
        appointment_end_at: request.finalized_end_at ?? request.requested_end_at,
      };
    }
    else if (type === 'counter_proposed' && bookingRequestId) {
      // Coach counter-proposed → email to client
      const { data: request, error: reqError } = await supabaseAdmin
        .from('booking_requests')
        .select(`
          id, requested_start_at, requested_end_at, counter_proposal_start_at, counter_proposal_end_at,
          coach_clients!inner(
            coach_id,
            clients!inner(first_name, last_name, email, user_id)
          )
        `)
        .eq('id', bookingRequestId)
        .single();

      if (reqError || !request) {
        throw new Error('Booking request not found');
      }

      const cc = request.coach_clients as any;
      const client = cc.clients;

      if (!client.email) {
        throw new Error('Client email not found');
      }

      emailType = 'appointment_counter_proposed';
      recipientEmail = client.email;
      recipientUserId = client.user_id;
      senderUserId = actorUserId; // Coach
      templateData = {
        client_name: `${client.first_name} ${client.last_name}`,
        original_start_at: request.requested_start_at,
        original_end_at: request.requested_end_at,
        proposed_start_at: request.counter_proposal_start_at,
        proposed_end_at: request.counter_proposal_end_at,
      };
    }
    else if (type === 'cancelled') {
      // Cancellation → email to counterpart
      if (bookingRequestId) {
        const { data: request, error: reqError } = await supabaseAdmin
          .from('booking_requests')
          .select(`
            id, requested_start_at, status,
            coach_clients!inner(
              coach_id,
              clients!inner(first_name, last_name, email, user_id)
            )
          `)
          .eq('id', bookingRequestId)
          .single();

        if (reqError || !request) {
          throw new Error('Booking request not found');
        }

        const cc = request.coach_clients as any;
        const client = cc.clients;

        // Determine who cancelled based on status
        const isClientCancelling = request.status === 'CANCELED_BY_CLIENT';
        
        if (isClientCancelling) {
          // Client cancelled → email to coach
          const { data: coachUser } = await supabaseAdmin
            .from('users')
            .select('email')
            .eq('id', cc.coach_id)
            .single();

          if (!coachUser?.email) {
            throw new Error('Coach email not found');
          }

          recipientEmail = coachUser.email;
          recipientUserId = cc.coach_id;
          senderUserId = client.user_id;
        } else {
          // Coach declined → email to client
          if (!client.email) {
            throw new Error('Client email not found');
          }

          recipientEmail = client.email;
          recipientUserId = client.user_id;
          senderUserId = actorUserId;
        }

        emailType = 'appointment_cancelled';
        templateData = {
          client_name: `${client.first_name} ${client.last_name}`,
          appointment_start_at: request.requested_start_at,
          cancelled_by: isClientCancelling ? 'client' : 'coach',
        };
      } 
      else if (eventId) {
        // Event cancellation
        const { data: event, error: evError } = await supabaseAdmin
          .from('events')
          .select(`
            id, start_at, end_at, title,
            coach_clients!inner(
              coach_id,
              clients!inner(first_name, last_name, email, user_id)
            )
          `)
          .eq('id', eventId)
          .single();

        if (evError || !event) {
          throw new Error('Event not found');
        }

        const cc = event.coach_clients as any;
        const client = cc.clients;

        // Determine who cancelled based on actorUserId
        const isClientCancelling = actorUserId === client.user_id;

        if (isClientCancelling) {
          const { data: coachUser } = await supabaseAdmin
            .from('users')
            .select('email')
            .eq('id', cc.coach_id)
            .single();

          if (!coachUser?.email) {
            throw new Error('Coach email not found');
          }

          recipientEmail = coachUser.email;
          recipientUserId = cc.coach_id;
          senderUserId = client.user_id;
        } else {
          if (!client.email) {
            throw new Error('Client email not found');
          }

          recipientEmail = client.email;
          recipientUserId = client.user_id;
          senderUserId = actorUserId;
        }

        emailType = 'appointment_cancelled';
        templateData = {
          client_name: `${client.first_name} ${client.last_name}`,
          appointment_start_at: event.start_at,
          appointment_end_at: event.end_at,
          appointment_title: event.title ?? 'Appuntamento',
          cancelled_by: isClientCancelling ? 'client' : 'coach',
        };
      } else {
        return new Response(
          JSON.stringify({ error: 'bookingRequestId or eventId required for cancelled type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    else {
      return new Response(
        JSON.stringify({ error: `Invalid request type: ${type}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Queue the email
    const result = await queueEmail(supabaseAdmin, {
      type: emailType!,
      toEmail: recipientEmail!,
      recipientUserId: recipientUserId!,
      senderUserId: senderUserId!,
      templateData: templateData!,
    });

    console.log(`[queue-booking-email] Successfully queued ${type} email:`, result.id);

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
