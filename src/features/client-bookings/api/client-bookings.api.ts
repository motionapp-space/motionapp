/**
 * API functions for Client Bookings
 * All functions operate from the client's perspective using auth_user_id
 */

import { supabase } from "@/integrations/supabase/client";
import { getClientCoachClientId } from "@/lib/coach-client";
import type { 
  ClientBookingSettings, 
  ClientAppointmentView, 
  ClientAppointmentStatus,
  CreateBookingRequestInput,
  AvailableSlot 
} from "../types";
import { addHours, isBefore, parseISO, subHours } from "date-fns";

/**
 * Helper: Get current client's data from auth_user_id
 */
async function getCurrentClientData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: client, error } = await supabase
    .from("clients")
    .select("id, coach_id")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !client) throw new Error("Client profile not found");
  return client;
}

/**
 * Derive unified status from DB fields
 */
function deriveClientAppointmentStatus(
  type: 'event' | 'booking_request',
  sessionStatus: string | null,
  proposalStatus: string | null,
  bookingRequestStatus: string | null,
  startAt: string
): ClientAppointmentStatus {
  const isPast = isBefore(parseISO(startAt), new Date());

  if (type === 'booking_request') {
    if (bookingRequestStatus === 'PENDING') return 'REQUESTED';
    if (bookingRequestStatus === 'COUNTER_PROPOSED') return 'COUNTER_PROPOSAL';
    if (bookingRequestStatus === 'DECLINED' || bookingRequestStatus === 'CANCELED_BY_CLIENT') return 'CANCELLED';
    if (bookingRequestStatus === 'APPROVED') return 'CONFIRMED'; // Should become an event
    return 'CANCELLED';
  }

  // Type is 'event'
  if (sessionStatus === 'canceled') return 'CANCELLED';
  if (proposalStatus === 'pending') return 'CHANGE_PROPOSED';
  if (isPast) return 'COMPLETED';
  return 'CONFIRMED';
}

/**
 * Check if appointment can be cancelled based on cancel policy
 */
function canCancelAppointment(startAt: string, cancelPolicyHours: number): { canCancel: boolean; deadline?: string } {
  const appointmentStart = parseISO(startAt);
  const deadline = subHours(appointmentStart, cancelPolicyHours);
  const now = new Date();
  
  return {
    canCancel: isBefore(now, deadline),
    deadline: deadline.toISOString()
  };
}

/**
 * Get booking settings for current client's coach
 */
export async function getClientBookingSettings(): Promise<ClientBookingSettings> {
  const { coach_id } = await getCurrentClientData();

  const { data, error } = await supabase
    .from("booking_settings")
    .select("enabled, cancel_policy_hours, slot_duration_minutes, min_advance_notice_hours, max_future_days, buffer_between_minutes")
    .eq("coach_id", coach_id)
    .single();

  if (error) {
    // If no settings exist, return defaults (disabled)
    if (error.code === 'PGRST116') {
      return {
        enabled: false,
        cancelPolicyHours: 24,
        slotDurationMinutes: 60,
        minAdvanceNoticeHours: 24,
        maxFutureDays: null,
        bufferBetweenMinutes: 0
      };
    }
    throw error;
  }

  return {
    enabled: data.enabled,
    cancelPolicyHours: data.cancel_policy_hours ?? 24,
    slotDurationMinutes: data.slot_duration_minutes,
    minAdvanceNoticeHours: data.min_advance_notice_hours,
    maxFutureDays: data.max_future_days,
    bufferBetweenMinutes: data.buffer_between_minutes ?? 0
  };
}

/**
 * Get all appointments for current client (unified view)
 */
export async function getClientAppointments(): Promise<ClientAppointmentView[]> {
  const { coachClientId } = await getClientCoachClientId();
  const settings = await getClientBookingSettings();
  
  // Fetch events
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, title, start_at, end_at, location, notes, session_status, proposal_status, proposed_start_at, proposed_end_at")
    .eq("coach_client_id", coachClientId)
    .order("start_at", { ascending: false });

  if (eventsError) throw eventsError;

  // Fetch booking requests (include counter proposal fields)
  const { data: requests, error: requestsError } = await supabase
    .from("booking_requests")
    .select("id, requested_start_at, requested_end_at, notes, status, counter_proposal_start_at, counter_proposal_end_at")
    .eq("coach_client_id", coachClientId)
    .order("requested_start_at", { ascending: false });

  if (requestsError) throw requestsError;

  const appointments: ClientAppointmentView[] = [];

  // Map events to unified view
  for (const event of events || []) {
    const status = deriveClientAppointmentStatus(
      'event',
      event.session_status,
      event.proposal_status,
      null,
      event.start_at
    );

    const cancelInfo = canCancelAppointment(event.start_at, settings.cancelPolicyHours);

    appointments.push({
      id: event.id,
      type: 'event',
      status,
      title: event.title || 'Appuntamento',
      startAt: event.start_at,
      endAt: event.end_at,
      location: event.location || undefined,
      notes: event.notes || undefined,
      proposedStartAt: event.proposed_start_at || undefined,
      proposedEndAt: event.proposed_end_at || undefined,
      canCancel: status === 'CONFIRMED' && cancelInfo.canCancel,
      cancelDeadline: cancelInfo.deadline
    });
  }

  // Map booking requests to unified view
  for (const request of requests || []) {
    const status = deriveClientAppointmentStatus(
      'booking_request',
      null,
      null,
      request.status,
      request.requested_start_at
    );

    // Titolo dinamico: "Appuntamento" se confermato, altrimenti "Richiesta appuntamento"
    const title = status === 'CONFIRMED' ? 'Appuntamento' : 'Richiesta appuntamento';

    // Calcola canCancel e cancelDeadline in base allo status
    let canCancel = false;
    let cancelDeadline: string | undefined;

    if (status === 'REQUESTED' || status === 'COUNTER_PROPOSAL') {
      // Richieste in attesa: sempre annullabili
      canCancel = true;
    } else if (status === 'CONFIRMED') {
      // Appuntamenti confermati: applicare la finestra di cancellazione
      const cancelInfo = canCancelAppointment(request.requested_start_at, settings.cancelPolicyHours);
      canCancel = cancelInfo.canCancel;
      cancelDeadline = cancelInfo.deadline;
    }

    appointments.push({
      id: request.id,
      type: 'booking_request',
      status,
      title,
      startAt: request.requested_start_at,
      endAt: request.requested_end_at,
      notes: request.notes || undefined,
      counterProposedStartAt: request.counter_proposal_start_at || undefined,
      counterProposedEndAt: request.counter_proposal_end_at || undefined,
      canCancel,
      cancelDeadline,
    });
  }

  return appointments;
}

/**
 * Create a new booking request
 */
export async function createBookingRequest(input: CreateBookingRequestInput): Promise<void> {
  const { coachClientId } = await getClientCoachClientId();

  const { error } = await supabase
    .from("booking_requests")
    .insert({
      coach_client_id: coachClientId,
      requested_start_at: input.requestedStartAt,
      requested_end_at: input.requestedEndAt,
      notes: input.notes || null,
      status: 'PENDING'
    });

  if (error) throw error;
}

/**
 * Cancel a booking request (set to CANCELED_BY_CLIENT)
 */
export async function cancelBookingRequest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from("booking_requests")
    .update({ status: 'CANCELED_BY_CLIENT' })
    .eq("id", requestId);

  if (error) throw error;
}

/**
 * Cancel an appointment (event)
 */
export async function cancelAppointment(eventId: string): Promise<void> {
  const { error } = await supabase
    .from("events")
    .update({ session_status: 'canceled' })
    .eq("id", eventId);

  if (error) throw error;
}

/**
 * Accept a change proposal from coach
 */
export async function acceptChangeProposal(eventId: string): Promise<void> {
  // First get the event to retrieve proposed times
  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("proposed_start_at, proposed_end_at")
    .eq("id", eventId)
    .single();

  if (fetchError) throw fetchError;
  if (!event.proposed_start_at || !event.proposed_end_at) {
    throw new Error("No proposal to accept");
  }

  // Apply proposed times and reset proposal fields
  const { error } = await supabase
    .from("events")
    .update({
      start_at: event.proposed_start_at,
      end_at: event.proposed_end_at,
      proposed_start_at: null,
      proposed_end_at: null,
      proposal_status: null
    })
    .eq("id", eventId);

  if (error) throw error;
}

/**
 * Reject a change proposal from coach (cancels the appointment)
 */
export async function rejectChangeProposal(eventId: string): Promise<void> {
  const { error } = await supabase
    .from("events")
    .update({
      session_status: 'canceled',
      proposed_start_at: null,
      proposed_end_at: null,
      proposal_status: null
    })
    .eq("id", eventId);

  if (error) throw error;
}

/**
 * Accept a counter-proposal from coach (set booking request to APPROVED)
 */
export async function acceptCounterProposal(requestId: string): Promise<void> {
  const { error } = await supabase
    .from("booking_requests")
    .update({ status: 'APPROVED' })
    .eq("id", requestId);

  if (error) throw error;
}

/**
 * Reject a counter-proposal from coach (set booking request to CANCELED_BY_CLIENT)
 */
export async function rejectCounterProposal(requestId: string): Promise<void> {
  const { error } = await supabase
    .from("booking_requests")
    .update({ status: 'CANCELED_BY_CLIENT' })
    .eq("id", requestId);

  if (error) throw error;
}

/**
 * Get available slots for booking
 */
export async function getAvailableSlotsForClient(
  startDate: Date,
  endDate: Date
): Promise<AvailableSlot[]> {
  const { coachId } = await getClientCoachClientId();
  const settings = await getClientBookingSettings();

  if (!settings.enabled) return [];

  // Get availability windows
  const { data: windows, error: windowsError } = await supabase
    .from("availability_windows")
    .select("day_of_week, start_time, end_time")
    .eq("coach_id", coachId)
    .eq("is_active", true);

  if (windowsError) throw windowsError;

  // Get all occupied slots using database function (bypasses RLS to see all coach's bookings)
  const { data: occupiedSlots, error: occupiedError } = await supabase
    .rpc('get_coach_occupied_slots', {
      p_coach_id: coachId,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString()
    });

  if (occupiedError) throw occupiedError;

  // Get out-of-office blocks
  const { data: oooBlocks, error: oooError } = await supabase
    .from("out_of_office_blocks")
    .select("start_at, end_at")
    .eq("coach_id", coachId)
    .gte("end_at", startDate.toISOString())
    .lte("start_at", endDate.toISOString());

  if (oooError) throw oooError;

  // Merge occupied slots with out-of-office blocks
  const allOccupiedSlots = [
    ...(occupiedSlots || []).map(s => ({ start_at: s.start_at, end_at: s.end_at })),
    ...(oooBlocks || []).map(b => ({ start_at: b.start_at, end_at: b.end_at }))
  ];

  // Generate slots based on availability windows
  const slots: AvailableSlot[] = [];
  const minNoticeTime = addHours(new Date(), settings.minAdvanceNoticeHours);
  const bufferMinutes = settings.bufferBetweenMinutes;
  
  // Iterate through each day in range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    // Convert to our day format (0 = Monday)
    const ourDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Find windows for this day
    const dayWindows = (windows || []).filter(w => w.day_of_week === ourDayOfWeek);

    for (const window of dayWindows) {
      // Parse window times
      const [startH, startM] = window.start_time.split(':').map(Number);
      const [endH, endM] = window.end_time.split(':').map(Number);

      // Generate slots within window
      let slotStart = new Date(currentDate);
      slotStart.setHours(startH, startM, 0, 0);

      const windowEnd = new Date(currentDate);
      windowEnd.setHours(endH, endM, 0, 0);

      while (slotStart < windowEnd) {
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + settings.slotDurationMinutes);

        if (slotEnd <= windowEnd) {
          // Check if slot is after minimum notice time
          if (slotStart > minNoticeTime) {
            // Check if slot conflicts with occupied slots (events + pending requests + OOO)
            const isOccupied = allOccupiedSlots.some(occupied => {
              const occStart = new Date(occupied.start_at);
              const occEnd = new Date(occupied.end_at);
              return slotStart < occEnd && slotEnd > occStart;
            });

            if (!isOccupied) {
              slots.push({
                start: slotStart.toISOString(),
                end: slotEnd.toISOString()
              });
            }
          }
        }

        // Move to next slot with buffer
        slotStart = new Date(slotStart);
        slotStart.setMinutes(slotStart.getMinutes() + settings.slotDurationMinutes + bufferMinutes);
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots;
}
