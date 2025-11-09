export type BookingRequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'COUNTER_PROPOSED';
export type ApprovalMode = 'AUTO' | 'MANUAL';

export interface BookingRequest {
  id: string;
  coach_id: string;
  client_id: string;
  requested_start_at: string;
  requested_end_at: string;
  status: BookingRequestStatus;
  notes?: string;
  counter_proposal_start_at?: string;
  counter_proposal_end_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingRequestWithClient extends BookingRequest {
  client_name: string;
}

export interface CreateBookingRequestInput {
  client_id: string;
  requested_start_at: string;
  requested_end_at: string;
  notes?: string;
}

export interface UpdateBookingRequestInput {
  status?: BookingRequestStatus;
  notes?: string;
  counter_proposal_start_at?: string;
  counter_proposal_end_at?: string;
}

export interface BookingSettings {
  id: string;
  coach_id: string;
  enabled: boolean;
  min_advance_notice_hours: number;
  slot_duration_minutes: number;
  approval_mode: ApprovalMode;
  buffer_before_minutes?: number;
  buffer_after_minutes?: number;
  buffer_between_minutes?: number;
  cancel_policy_hours?: number;
  max_future_days?: number;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateBookingSettingsInput {
  enabled?: boolean;
  min_advance_notice_hours?: number;
  slot_duration_minutes?: number;
  approval_mode?: ApprovalMode;
  buffer_before_minutes?: number;
  buffer_after_minutes?: number;
  buffer_between_minutes?: number;
  cancel_policy_hours?: number;
  max_future_days?: number;
  timezone?: string;
}

export interface AvailabilityWindow {
  id: string;
  coach_id: string;
  day_of_week: number; // 0-6, 0=Monday
  start_time: string;  // HH:MM format
  end_time: string;    // HH:MM format
  created_at: string;
}

export interface CreateAvailabilityWindowInput {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface OutOfOfficeBlock {
  id: string;
  coach_id: string;
  start_at: string;
  end_at: string;
  reason?: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  created_at: string;
}

export interface CreateOutOfOfficeBlockInput {
  start_at: string;
  end_at: string;
  reason?: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
}

export interface UpdateOutOfOfficeBlockInput {
  start_at?: string;
  end_at?: string;
  reason?: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
}

export interface AvailableSlot {
  start: string;
  end: string;
}
