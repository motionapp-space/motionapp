export interface Event {
  id: string;
  coach_id: string;
  client_id: string;
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
  created_at: string;
  updated_at: string;
}

export interface EventWithClient extends Event {
  client_name: string;
}

export interface CreateEventInput {
  client_id: string;
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
}

export interface UpdateEventInput {
  title?: string;
  client_id?: string;
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
