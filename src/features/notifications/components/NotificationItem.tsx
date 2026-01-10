import { cn } from "@/lib/utils";
import type { CoachNotification } from "../types";
import { formatRelativeTime } from "../utils/formatRelativeTime";

interface NotificationItemProps {
  notification: CoachNotification;
  variant?: "compact" | "full";
  onClick?: () => void;
}

export function NotificationItem({ 
  notification, 
  variant = "compact",
  onClick 
}: NotificationItemProps) {
  const isUnread = !notification.is_read;
  const isCompact = variant === "compact";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left transition-colors",
        "grid grid-cols-[auto_1fr_auto] gap-3 items-start",
        isCompact ? "px-4 py-3" : "px-4 py-4",
        "hover:bg-muted/50",
        "focus:outline-none focus-visible:bg-muted/50"
      )}
    >
      {/* Unread indicator */}
      <div className="pt-1.5 w-2">
        {isUnread && (
          <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 space-y-0.5">
        <p
          className={cn(
            "text-sm leading-snug",
            isUnread ? "font-medium text-foreground" : "text-foreground",
            isCompact ? "line-clamp-1" : "line-clamp-2"
          )}
        >
          {notification.title}
        </p>
        {notification.message && (
          <p className={cn(
            "text-xs text-muted-foreground leading-relaxed",
            isCompact ? "line-clamp-1" : "line-clamp-2"
          )}>
            {notification.message}
          </p>
        )}
      </div>

      {/* Timestamp */}
      <span className="text-xs text-muted-foreground/70 whitespace-nowrap pt-0.5">
        {formatRelativeTime(notification.created_at)}
      </span>
    </button>
  );
}
