export interface Event {
  id: string;
  coach_client_id: string;
  title: string;
  start_at: string;
  end_at: string;
  location?: string;
  notes?: string;
  is_all_day?: boolean;
  reminder_offset_minutes?: number;
  color?: string;
  recurrence_rule?: string;
  linked_plan_id?: string;
  linked_day_id?: string;
  session_status?: "scheduled" | "done" | "canceled" | "no_show";
  aligned_to_slot?: boolean;
  source?: 'manual' | 'generated' | 'client';
  proposal_status?: string;
  proposed_start_at?: string;
  proposed_end_at?: string;
  series_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventWithClient extends Event {
  client_name: string;
}

export interface CreateEventInput {
  coach_client_id: string;
  title: string;
  start_at: string;
  end_at: string;
  location?: string;
  notes?: string;
  is_all_day?: boolean;
  reminder_offset_minutes?: number;
  color?: string;
  recurrence_rule?: string;
  linked_plan_id?: string;
  linked_day_id?: string;
  session_status?: "scheduled" | "done" | "canceled" | "no_show";
  aligned_to_slot?: boolean;
  source?: 'manual' | 'generated' | 'client';
  series_id?: string;
}

export interface UpdateEventInput {
  title?: string;
  coach_client_id?: string;
  start_at?: string;
  end_at?: string;
  location?: string;
  notes?: string;
  is_all_day?: boolean;
  reminder_offset_minutes?: number;
  color?: string;
  recurrence_rule?: string;
  linked_plan_id?: string;
  linked_day_id?: string;
  session_status?: "scheduled" | "done" | "canceled" | "no_show";
  aligned_to_slot?: boolean;
  source?: 'manual' | 'generated' | 'client';
  proposal_status?: string;
  proposed_start_at?: string;
  proposed_end_at?: string;
}

export interface EventsFilters {
  q?: string;
  start_date?: string;
  end_date?: string;
  client_id?: string;
}

export type CalendarView = "day" | "week" | "month" | "year";

// FASE 1: Calendar mode types
export type CalendarMode = 'coach' | 'client';

export interface CalendarContext {
  mode: CalendarMode;
  coachId: string;
  clientId?: string; // Solo per mode='client'
}

// FASE 1 Extended: View mode types per simulazione
export type CalendarViewMode = 'coach' | 'client-preview' | 'specific-client';

export interface CalendarPreviewState {
  viewMode: CalendarViewMode;
  previewClientId?: string;
}
