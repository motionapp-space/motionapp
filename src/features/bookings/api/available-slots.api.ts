import { supabase } from "@/integrations/supabase/client";
import { generateAvailableSlots, generateFullDayGrid } from "../utils/slot-generator";
import type { AvailableSlot } from "../types";
import type { CalendarMode } from "@/features/events/types";
import { getCoachClientId } from "@/lib/coach-client";

interface GetAvailableSlotsParams {
  coachId: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  calendarMode?: CalendarMode; // FASE 2: Modalità calendario
  bypassEnabledCheck?: boolean; // Deprecated, use calendarMode instead
  clientId?: string; // FASE 3: ID cliente per regole specifiche
  applyClientRules?: boolean; // FASE 3: Applica regole cliente
}

/**
 * FASE 3 Extended: Client-specific rules check
 */
async function getClientSpecificRules(clientId: string, coachId: string) {
  // Get coach_client_id first
  let coachClientId: string;
  try {
    coachClientId = await getCoachClientId(clientId);
  } catch {
    // No coach-client relationship
    return { hasActivePackage: false, hasAvailableSessions: false, canBook: false };
  }

  const { data: packages } = await supabase
    .from("package")
    .select("*")
    .eq("coach_client_id", coachClientId)
    .eq("usage_status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const hasActivePackage = !!packages;
  const hasAvailableSessions = packages
    ? (packages.total_sessions - packages.consumed_sessions - packages.on_hold_sessions) > 0
    : false;

  return {
    hasActivePackage,
    hasAvailableSessions,
    canBook: hasActivePackage && hasAvailableSessions,
  };
}

/**
 * FASE 2: Fetches available slots with CalendarMode support
 * FASE 3 Extended: Support for client-specific rules
 * - coach mode: Genera griglia completa 06:00-22:00 anche senza availability configurate
 * - client mode: Genera solo slot prenotabili secondo le regole
 * - client-specific mode: Applica regole specifiche del cliente (pacchetti, sospensioni, etc.)
 */
export async function getAvailableSlots({
  coachId,
  startDate,
  endDate,
  calendarMode = 'client',
  bypassEnabledCheck = false,
  clientId,
  applyClientRules = false,
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
  // FASE 3: Check client-specific rules first if requested
  if (applyClientRules && clientId) {
    const rules = await getClientSpecificRules(clientId, coachId);
    if (!rules.canBook) {
      // Cliente senza pacchetto attivo o sessioni esaurite → nessuno slot disponibile
      return [];
    }
  }

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

  // Fetch coach_clients for this coach
  const { data: coachClients } = await supabase
    .from("coach_clients")
    .select("id, client_id")
    .eq("coach_id", coachId);

  const coachClientIds = coachClients?.map(cc => cc.id) || [];

  // Fetch existing events (both confirmed and pending requests)
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, coach_client_id, title, start_at, end_at, created_at, updated_at")
    .in("coach_client_id", coachClientIds)
    .gte("end_at", startDate)
    .lte("start_at", endDate);

  if (eventsError) throw eventsError;

  // Build client map for names
  const clientIds = coachClients?.map(cc => cc.client_id) || [];
  const { data: clientsData } = await supabase
    .from("clients")
    .select("id, first_name, last_name")
    .in("id", clientIds);
  
  const clientMap = new Map(clientsData?.map(c => [c.id, c]) || []);
  const ccToClientMap = new Map(coachClients?.map(cc => [cc.id, cc.client_id]) || []);

  // Fetch pending booking requests
  const { data: requests, error: requestsError } = await supabase
    .from("booking_requests")
    .select("*")
    .in("coach_client_id", coachClientIds)
    .eq("status", "PENDING")
    .gte("requested_end_at", startDate)
    .lte("requested_start_at", endDate);

  if (requestsError) throw requestsError;

  // Convert pending requests to event-like objects for overlap checking
  const requestEvents = requests?.map(req => ({
    id: req.id,
    coach_client_id: req.coach_client_id,
    title: "Richiesta di prenotazione",
    start_at: req.requested_start_at,
    end_at: req.requested_end_at,
    client_name: "",
    created_at: req.created_at,
    updated_at: req.updated_at,
  })) || [];

  // Map events to include client_name
  const mappedEvents = events?.map(event => {
    const clientId = ccToClientMap.get(event.coach_client_id);
    const client = clientId ? clientMap.get(clientId) : null;
    return {
      ...event,
      client_name: client ? `${client.first_name} ${client.last_name}`.trim() : "",
    };
  }) || [];

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
