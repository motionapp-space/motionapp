import type { CoachNotification } from "../types";

/**
 * Returns the appropriate navigation path for a notification based on its type
 */
export function getNotificationLink(notification: CoachNotification): string | null {
  const { related_type, related_id } = notification;

  if (!related_id) return null;

  switch (related_type) {
    case "session":
      // related_id is client_id for sessions
      return `/clients/${related_id}?tab=sessions`;
    
    case "appointment":
    case "event":
      // related_id is event_id
      return `/calendar?event=${related_id}`;
    
    case "client":
      return `/clients/${related_id}`;
    
    case "plan":
      // related_id is client_id for plan notifications
      return `/clients/${related_id}?tab=plans`;
    
    case "booking":
    case "booking_request":
      // Navigate to booking management
      return `/calendar/manage`;
    
    default:
      return null;
  }
}
