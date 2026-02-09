import { CheckCircle, XCircle, Clock, ClipboardList, type LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientNotification, ClientNotificationType } from "../types";
import { cn } from "@/lib/utils";

interface ClientNotificationItemProps {
  notification: ClientNotification;
  variant?: "compact" | "full";
  onClick?: () => void;
}

function getNotificationIcon(type: ClientNotificationType): LucideIcon {
  switch (type) {
    case "appointment_confirmed":
      return CheckCircle;
    case "appointment_canceled_by_coach":
    case "appointment_canceled_confirmed":
      return XCircle;
    case "counter_proposal_received":
      return Clock;
    case "booking_request_declined":
    case "booking_request_canceled":
      return XCircle;
    case "plan_assigned":
      return ClipboardList;
  }
}

function getIconColorClass(type: ClientNotificationType): string {
  switch (type) {
    case "appointment_confirmed":
      return "text-green-500";
    case "appointment_canceled_by_coach":
      return "text-destructive";
    case "appointment_canceled_confirmed":
    case "booking_request_canceled":
      return "text-muted-foreground";
    case "counter_proposal_received":
      return "text-amber-500";
    case "booking_request_declined":
      return "text-destructive";
    case "plan_assigned":
      return "text-blue-500";
  }
}

export function ClientNotificationItem({
  notification,
  variant = "compact",
  onClick,
}: ClientNotificationItemProps) {
  const Icon = getNotificationIcon(notification.type);
  const iconColorClass = getIconColorClass(notification.type);
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: it,
  });

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-start gap-2 py-3 cursor-pointer transition-colors hover:bg-muted/50",
        !notification.is_read && "bg-primary/5"
      )}
    >
      {/* Unread indicator */}
      <div className="flex items-center justify-center w-2 pt-2">
        {!notification.is_read && (
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        )}
      </div>

      {/* Icon */}
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", iconColorClass)} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm",
              variant === "compact" ? "line-clamp-1" : "line-clamp-2",
              notification.is_read ? "text-muted-foreground" : "text-foreground font-medium"
            )}
          >
            {notification.title}
          </p>
          <span className="text-xs text-muted-foreground shrink-0">{timeAgo}</span>
        </div>
        <p
          className={cn(
            "text-xs text-muted-foreground mt-0.5",
            variant === "compact" ? "line-clamp-1" : "line-clamp-2"
          )}
        >
          {notification.message}
        </p>
      </div>
    </div>
  );
}
