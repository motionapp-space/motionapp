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
        "hover:bg-muted/50",
        "focus:outline-none focus-visible:bg-muted/50",
        isCompact ? "px-4 py-3.5" : "px-4 py-4"
      )}
    >
      {/* Main row: icon + content + timestamp */}
      <div className="flex items-start gap-2">
        {/* Unread dot - fixed width for alignment */}
        <div className="w-2 flex-shrink-0 pt-1.5">
          {isUnread && (
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </div>

        {/* Icon - aligned top */}
        <Icon className="h-4 w-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* First row: Title + Timestamp */}
          <div className="flex items-start justify-between gap-3">
            <p
              className={cn(
                "text-sm leading-snug",
                isUnread ? "font-medium text-foreground" : "text-foreground"
              )}
            >
              {notification.title}
            </p>
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
    </button>
  );
}
