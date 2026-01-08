/**
 * Types for Client Bookings feature
 * Unified view model that hides the distinction between events and booking_requests
 */

export type ClientAppointmentStatus = 
  | 'REQUESTED'        // booking_request con status PENDING
  | 'CONFIRMED'        // event con session_status = scheduled (no proposal pending)
  | 'CHANGE_PROPOSED'  // event con proposal_status = pending
  | 'COUNTER_PROPOSAL' // booking_request con status COUNTER_PROPOSED
  | 'CANCELLED'        // event canceled o booking_request DECLINED/CANCELED_BY_CLIENT
  | 'COMPLETED';       // evento passato non canceled

export interface ClientBookingSettings {
  enabled: boolean;
  cancelPolicyHours: number;
  slotDurationMinutes: number;
  minAdvanceNoticeHours: number;
  maxFutureDays: number | null;
  bufferBetweenMinutes: number;
}

export interface ClientAppointmentView {
  id: string;
  type: 'event' | 'booking_request';
  status: ClientAppointmentStatus;
  title: string;
  startAt: string;
  endAt: string;
  location?: string;
  notes?: string;
  // Per CHANGE_PROPOSED (eventi)
  proposedStartAt?: string;
  proposedEndAt?: string;
  // Per COUNTER_PROPOSAL (booking requests)
  counterProposedStartAt?: string;
  counterProposedEndAt?: string;
  // Metadati per UI
  canCancel: boolean;
  cancelDeadline?: string;
}

export interface CreateBookingRequestInput {
  requestedStartAt: string;
  requestedEndAt: string;
  notes?: string;
  economicType: 'package' | 'single_paid';
  packageId?: string; // Required if economicType = 'package'
}

export interface AvailableSlot {
  start: string;
  end: string;
}

export interface ClientPackageOption {
  packageId: string;
  name: string;
  available: number;
  expiresAt: string | null;
  isFefoDefault: boolean;
}
