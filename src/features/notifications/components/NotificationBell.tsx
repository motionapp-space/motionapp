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
import { ScrollArea } from "@/components/ui/scroll-area";
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
    // Mark as read only - no navigation for now
    if (!notification.is_read) {
      markOne.mutate(notification.id);
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate("/notifications");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold">Notifiche</h3>
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

        {/* Notification list */}
        <ScrollArea className="max-h-[420px]">
          {displayedNotifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nessuna notifica
            </div>
          ) : (
            <div className="divide-y divide-border pb-2">
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
        </ScrollArea>

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
