import { supabase } from "@/integrations/supabase/client";
import { generateAvailableSlots, generateFullDayGrid } from "../utils/slot-generator";
import type { AvailableSlot } from "../types";
import type { CalendarMode } from "@/features/events/types";

interface GetAvailableSlotsParams {
  coachId: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  calendarMode?: CalendarMode; // FASE 2: Modalità calendario
  bypassEnabledCheck?: boolean; // Deprecated, use calendarMode instead
}

/**
 * FASE 2: Fetches available slots with CalendarMode support
 * - coach mode: Genera griglia completa 06:00-22:00 anche senza availability configurate
 * - client mode: Genera solo slot prenotabili secondo le regole
 */
export async function getAvailableSlots({
  coachId,
  startDate,
  endDate,
  calendarMode = 'client',
  bypassEnabledCheck = false,
}: GetAvailableSlotsParams): Promise<AvailableSlot[]> {
  const isCoachMode = calendarMode === 'coach' || bypassEnabledCheck;
  
  // COACH MODE: Generate full day grid regardless of availability
  if (isCoachMode) {
    const allSlots: AvailableSlot[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let currentDate = new Date(start);
    while (currentDate <= end) {
      const daySlots = generateFullDayGrid({
        date: currentDate,
        startHour: 6,
        endHour: 22,
        granularityMinutes: 15
      });
      
      allSlots.push(...daySlots);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return allSlots;
  }
  
  // CLIENT MODE: Original logic with availability rules
  // Fetch booking settings
  const query = supabase
    .from("booking_settings")
    .select("*")
    .eq("coach_id", coachId)
    .eq("enabled", true);

  const { data: settings, error: settingsError } = await query.maybeSingle();

  if (settingsError) throw settingsError;
  if (!settings) return []; // No booking enabled for client mode

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
      minAdvanceNoticeHours: settings.min_advance_notice_hours,
      availabilityWindows: windows,
      outOfOfficeBlocks: oooBlocks || [],
      existingEvents: allEvents,
    });
    
    allSlots.push(...daySlots);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return allSlots;
}
