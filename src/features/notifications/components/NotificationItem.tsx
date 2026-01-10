import { CheckCircle, XCircle, Clock, MessageSquare, FileCheck } from "lucide-react";
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
      return CheckCircle;
    case "appointment_canceled_by_client":
      return XCircle;
    case "autonomous_session_completed":
      return Clock;
    case "client_message":
      return MessageSquare;
    case "plan_completed":
      return FileCheck;
    default:
      return Clock;
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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left transition-colors",
        isCompact ? "px-4 py-3" : "px-4 py-4",
        "hover:bg-muted/50",
        "focus:outline-none focus-visible:bg-muted/50"
      )}
    >
      <div className="flex gap-3">
        {/* Icon + Unread indicator */}
        <div className="flex items-start gap-2 pt-0.5">
          {/* Unread dot */}
          <div className="w-2 flex-shrink-0">
            {isUnread && (
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
            )}
          </div>
          {/* Type icon - monochromatic, subtle */}
          <Icon className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
        </div>

        {/* Content - 3 row structure */}
        <div className="flex-1 min-w-0 space-y-0.5">
          {/* Row 1: Title */}
          <p
            className={cn(
              "text-sm leading-snug",
              isUnread ? "font-medium text-foreground" : "text-foreground"
            )}
          >
            {notification.title}
          </p>
          
          {/* Row 2: Detail (message with client + date/time info) */}
          {notification.message && (
            <p className={cn(
              "text-xs text-muted-foreground leading-relaxed",
              isCompact ? "line-clamp-1" : "line-clamp-2"
            )}>
              {notification.message}
            </p>
          )}
          
          {/* Row 3: Timestamp */}
          <p className="text-[11px] text-muted-foreground/70">
            {formatRelativeTime(notification.created_at)}
          </p>
        </div>
      </div>
    </button>
  );
}
