import { supabase } from "@/integrations/supabase/client";
import { generateAvailableSlots } from "../utils/slot-generator";
import type { AvailableSlot } from "../types";

interface GetAvailableSlotsParams {
  coachId: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  isCoachView?: boolean;
  bypassEnabledCheck?: boolean; // For coach mode - allows slots even if booking is disabled
}

/**
 * Fetches available slots for a coach within a date range.
 * This combines booking settings, availability windows, OOO blocks, and existing events
 * to generate only the slots that are actually bookable by clients.
 */
export async function getAvailableSlots({
  coachId,
  startDate,
  endDate,
  isCoachView = true,
  bypassEnabledCheck = false,
}: GetAvailableSlotsParams): Promise<AvailableSlot[]> {
  // Fetch booking settings
  const query = supabase
    .from("booking_settings")
    .select("*")
    .eq("coach_id", coachId);

  // Only check 'enabled' status for client booking mode
  if (!bypassEnabledCheck) {
    query.eq("enabled", true);
  }

  const { data: settings, error: settingsError } = await query.maybeSingle();

  if (settingsError) throw settingsError;
  
  // If no settings and we're in coach mode, use defaults
  if (!settings) {
    if (bypassEnabledCheck) {
      // Use default settings for coach mode
      const defaultSettings = {
        slot_duration_minutes: 45,
        buffer_between_minutes: 0,
        min_advance_notice_hours: 0,
      };
      
      // Still need availability windows to generate slots
      const { data: windows, error: windowsError } = await supabase
        .from("availability_windows")
        .select("*")
        .eq("coach_id", coachId)
        .eq("is_active", true);

      if (windowsError) throw windowsError;
      if (!windows || windows.length === 0) return [];

      // Fetch existing events
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("*, clients!events_client_id_fkey(first_name, last_name)")
        .eq("coach_id", coachId)
        .gte("end_at", startDate)
        .lte("start_at", endDate);

      if (eventsError) throw eventsError;

      const mappedEvents = events?.map(event => ({
        ...event,
        client_name: event.clients
          ? `${event.clients.first_name} ${event.clients.last_name}`.trim()
          : "",
      })) || [];

      // Generate slots with defaults
      const allSlots: AvailableSlot[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      let currentDate = new Date(start);
      while (currentDate <= end) {
        const daySlots = generateAvailableSlots({
          date: currentDate,
          slotDurationMinutes: defaultSettings.slot_duration_minutes,
          bufferBetweenMinutes: defaultSettings.buffer_between_minutes,
          minAdvanceNoticeHours: defaultSettings.min_advance_notice_hours,
          availabilityWindows: windows,
          outOfOfficeBlocks: [],
          existingEvents: mappedEvents,
        });
        
        allSlots.push(...daySlots);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return allSlots;
    }
    return []; // Booking not enabled for client mode
  }

  // Fetch availability windows
  const { data: windows, error: windowsError } = await supabase
    .from("availability_windows")
    .select("*")
    .eq("coach_id", coachId)
    .eq("is_active", true);

  if (windowsError) throw windowsError;
  if (!windows || windows.length === 0) return [];

  // Fetch out-of-office blocks
  const { data: oooBlocks, error: oooError } = await supabase
    .from("out_of_office_blocks")
    .select("*")
    .eq("coach_id", coachId)
    .gte("end_at", startDate)
    .lte("start_at", endDate);

  if (oooError) throw oooError;

  // Fetch existing events (both confirmed and pending requests)
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*, clients!events_client_id_fkey(first_name, last_name)")
    .eq("coach_id", coachId)
    .gte("end_at", startDate)
    .lte("start_at", endDate);

  if (eventsError) throw eventsError;

  // Fetch pending booking requests
  const { data: requests, error: requestsError } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("coach_id", coachId)
    .eq("status", "PENDING")
    .gte("requested_end_at", startDate)
    .lte("requested_start_at", endDate);

  if (requestsError) throw requestsError;

  // Convert pending requests to event-like objects for overlap checking
  const requestEvents = requests?.map(req => ({
    id: req.id,
    coach_id: req.coach_id,
    client_id: req.client_id,
    title: "Richiesta di prenotazione",
    start_at: req.requested_start_at,
    end_at: req.requested_end_at,
    client_name: "",
    created_at: req.created_at,
    updated_at: req.updated_at,
  })) || [];

  // Map events to include client_name
  const mappedEvents = events?.map(event => ({
    ...event,
    client_name: event.clients
      ? `${event.clients.first_name} ${event.clients.last_name}`.trim()
      : "",
  })) || [];

  const allEvents = [...mappedEvents, ...requestEvents];

  // Generate slots for each day in the range
  const allSlots: AvailableSlot[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let currentDate = new Date(start);
  while (currentDate <= end) {
    const daySlots = generateAvailableSlots({
      date: currentDate,
      slotDurationMinutes: settings.slot_duration_minutes,
      bufferBetweenMinutes: settings.buffer_between_minutes || 0,
      minAdvanceNoticeHours: isCoachView ? 0 : settings.min_advance_notice_hours,
      availabilityWindows: windows,
      outOfOfficeBlocks: oooBlocks || [],
      existingEvents: allEvents,
    });
    
    allSlots.push(...daySlots);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return allSlots;
}
