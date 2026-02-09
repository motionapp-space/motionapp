export type ClientNotificationType =
  | "appointment_confirmed"
  | "appointment_canceled_by_coach"
  | "appointment_canceled_confirmed"
  | "counter_proposal_received"
  | "booking_request_canceled"
  | "booking_request_declined"
  | "plan_assigned";

export interface ClientNotification {
  id: string;
  client_id: string;
  type: ClientNotificationType;
  title: string;
  message: string;
  related_id?: string;
  related_type?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}
