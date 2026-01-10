export type NotificationType = 
  | "autonomous_session_completed"
  | "client_message"
  | "plan_completed"
  | "appointment_canceled_by_client"
  | "booking_approved"
  | "booking_requested"
  | "booking_rejected"
  | "counter_proposal_accepted"
  | "counter_proposal_rejected";

export interface CoachNotification {
  id: string;
  coach_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_id?: string;
  related_type?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}
