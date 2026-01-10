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
    if (!notification.is_read) {
      markOne.mutate(notification.id);
    }
  };

  if (!showGroupHeaders) {
    return (
      <div>
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
    <div>
      {groupOrder.map((key, groupIndex) => {
        const items = grouped[key];
        if (items.length === 0) return null;

        return (
          <div 
            key={key} 
            className={groupIndex > 0 ? "mt-6" : ""}
          >
            {/* Group header - 12px gap to first item */}
            <div className="px-4 pb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {getGroupLabel(key)}
              </span>
            </div>
            {/* Items */}
            <div>
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
