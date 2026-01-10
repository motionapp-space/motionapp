import { CheckCircle, XCircle, Activity, MessageSquare, FileCheck, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoachNotification, NotificationType } from "../types";
import { formatRelativeTime } from "../utils/formatRelativeTime";

interface NotificationItemProps {
  notification: CoachNotification;
  variant?: "compact" | "full";
  onClick?: () => void;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "booking_approved":
    case "counter_proposal_accepted":
      return CheckCircle;
    case "appointment_canceled_by_client":
    case "booking_rejected":
    case "counter_proposal_rejected":
      return XCircle;
    case "autonomous_session_completed":
      return Activity;
    case "client_message":
      return MessageSquare;
    case "plan_completed":
      return FileCheck;
    case "booking_requested":
      return Calendar;
    default:
      return Activity;
  }
}

export function NotificationItem({ 
  notification, 
  variant = "compact",
  onClick 
}: NotificationItemProps) {
  const isUnread = !notification.is_read;
  const isCompact = variant === "compact";
  const Icon = getNotificationIcon(notification.type);

  return (
    <div
      onClick={onClick}
      className={cn(
        "w-full text-left",
        "hover:bg-muted/30 transition-colors",
        isCompact ? "py-3.5" : "py-4"
      )}
    >
      {/* Main row: icon + content + timestamp */}
      <div className="flex items-start gap-2">
        {/* Icon - aligned top */}
        <Icon className="h-4 w-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* First row: Unread dot + Title + Timestamp */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-1.5 min-w-0">
              {isUnread && (
                <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              )}
              <p
                className={cn(
                  "text-sm leading-snug truncate",
                  isUnread ? "font-medium text-foreground" : "text-foreground"
                )}
              >
                {notification.title}
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground/70 whitespace-nowrap flex-shrink-0">
              {formatRelativeTime(notification.created_at)}
            </span>
          </div>
          
          {/* Second row: Detail (message) */}
          {notification.message && (
            <p className={cn(
              "text-xs text-muted-foreground leading-relaxed mt-1",
              isCompact ? "line-clamp-1" : "line-clamp-2"
            )}>
              {notification.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
