import { useState } from "react";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { NotificationList } from "@/features/notifications/components/NotificationList";
import { useNotificationsQuery } from "@/features/notifications/hooks/useNotificationsQuery";
import { useMarkAsRead } from "@/features/notifications/hooks/useMarkAsRead";
import { Skeleton } from "@/components/ui/skeleton";
import { useTopbar } from "@/contexts/TopbarContext";

type FilterType = "all" | "unread";

export default function Notifications() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("all");
  const { data: notifications = [], isLoading } = useNotificationsQuery();
  const { markAll } = useMarkAsRead();

  useTopbar({
    title: "Notifiche",
    showBack: true,
    onBack: () => navigate(-1),
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <div className="flex flex-col h-full">
      {/* Filter bar - no border, whitespace separation */}
      <div className="flex items-center justify-between mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10 pt-6 pb-5">
        <div className="flex gap-1">
          <Toggle
            pressed={filter === "all"}
            onPressedChange={() => setFilter("all")}
            size="sm"
            variant="outline"
            className="text-xs h-8 px-3"
          >
            Tutte
          </Toggle>
          <Toggle
            pressed={filter === "unread"}
            onPressedChange={() => setFilter("unread")}
            size="sm"
            variant="outline"
            className="text-xs h-8 px-3"
          >
            Non lette
            {unreadCount > 0 && (
              <span className="ml-1.5 text-muted-foreground">({unreadCount})</span>
            )}
          </Toggle>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="text-xs h-8"
          >
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Segna tutte
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-2">
                <Skeleton className="h-1.5 w-1.5 rounded-full mt-2" />
                <Skeleton className="h-4 w-4 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground text-sm">
              {filter === "unread"
                ? "Nessuna notifica non letta"
                : "Nessuna notifica"}
            </p>
          </div>
        ) : (
          <NotificationList
            notifications={filteredNotifications}
            variant="full"
            showGroupHeaders
          />
        )}
      </div>
    </div>
  );
}
