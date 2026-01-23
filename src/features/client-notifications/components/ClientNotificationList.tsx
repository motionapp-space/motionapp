import type { ClientNotification } from "../types";
import { ClientNotificationItem } from "./ClientNotificationItem";
import {
  groupClientNotificationsByDate,
  getGroupLabel,
  type GroupedClientNotifications,
} from "../utils/groupByDate";
import { useClientMarkAsRead } from "../hooks/useClientMarkAsRead";

interface ClientNotificationListProps {
  notifications: ClientNotification[];
  variant?: "compact" | "full";
  showGroupHeaders?: boolean;
}

export function ClientNotificationList({
  notifications,
  variant = "compact",
  showGroupHeaders = false,
}: ClientNotificationListProps) {
  const { markOne } = useClientMarkAsRead();

  const handleClick = (notification: ClientNotification) => {
    if (!notification.is_read) {
      markOne.mutate(notification.id);
    }
  };

  if (!showGroupHeaders) {
    return (
      <div>
        {notifications.map((notification) => (
          <ClientNotificationItem
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
  const grouped = groupClientNotificationsByDate(notifications);
  const groupOrder: (keyof GroupedClientNotifications)[] = [
    "today",
    "yesterday",
    "lastWeek",
    "older",
  ];

  return (
    <div>
      {groupOrder.map((key, groupIndex) => {
        const items = grouped[key];
        if (items.length === 0) return null;

        return (
          <div key={key} className={groupIndex > 0 ? "mt-6" : ""}>
            {/* Group header */}
            <div className="pb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {getGroupLabel(key)}
              </span>
            </div>
            {/* Items */}
            <div>
              {items.map((notification) => (
                <ClientNotificationItem
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
