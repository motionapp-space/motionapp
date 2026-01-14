import { useState } from "react";
import { Bell, Check, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotificationsQuery } from "../hooks/useNotificationsQuery";
import { useMarkAsRead } from "../hooks/useMarkAsRead";
import { NotificationItem } from "./NotificationItem";
import type { CoachNotification } from "../types";

const MAX_DROPDOWN_ITEMS = 10;

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useNotificationsQuery();
  const { markOne, markAll } = useMarkAsRead();

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const displayedNotifications = notifications.slice(0, MAX_DROPDOWN_ITEMS);

  const handleNotificationClick = (notification: CoachNotification) => {
    if (!notification.is_read) {
      markOne.mutate(notification.id);
    }
    // No navigation - just mark as read
  };

  const handleViewAll = () => {
    setOpen(false); // Close dropdown before navigation
    navigate("/notifications");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-base font-semibold">Notifiche</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAll.mutate()}
              className="h-7 text-xs px-2"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Segna tutte
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />

        {/* Notification list - scrollable container */}
        <div className="max-h-[420px] overflow-y-auto">
          {displayedNotifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nessuna notifica
            </div>
          ) : (
            <div className="divide-y divide-border pb-1 px-4">
              {displayedNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  variant="compact"
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer - View all CTA */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="m-0" />
            <button
              type="button"
              onClick={handleViewAll}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              Vedi tutte le notifiche
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
