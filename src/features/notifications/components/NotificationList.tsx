import type { CoachNotification } from "../types";
import { NotificationItem } from "./NotificationItem";
import { groupByDate, getGroupLabel, type GroupedNotifications } from "../utils/groupByDate";
import { useMarkAsRead } from "../hooks/useMarkAsRead";

interface NotificationListProps {
  notifications: CoachNotification[];
  variant?: "compact" | "full";
  showGroupHeaders?: boolean;
}

export function NotificationList({ 
  notifications, 
  variant = "compact",
  showGroupHeaders = false 
}: NotificationListProps) {
  const { markOne } = useMarkAsRead();

  const handleClick = (notification: CoachNotification) => {
    // Mark as read only - no navigation for now
    if (!notification.is_read) {
      markOne.mutate(notification.id);
    }
  };

  if (!showGroupHeaders) {
    // Simple flat list
    return (
      <div className="divide-y divide-border">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            variant={variant}
            onClick={() => handleClick(notification)}
          />
        ))}
      </div>
    );
  }

  // Grouped list with headers
  const grouped = groupByDate(notifications);
  const groupOrder: (keyof GroupedNotifications)[] = ["today", "yesterday", "lastWeek", "older"];

  return (
    <div className="space-y-1">
      {groupOrder.map((key) => {
        const items = grouped[key];
        if (items.length === 0) return null;

        return (
          <div key={key}>
            <div className="px-4 py-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {getGroupLabel(key)}
              </span>
            </div>
            <div className="divide-y divide-border">
              {items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  variant={variant}
                  onClick={() => handleClick(notification)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
