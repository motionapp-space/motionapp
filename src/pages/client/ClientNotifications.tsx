import { useState } from "react";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { ClientNotificationList } from "@/features/client-notifications/components/ClientNotificationList";
import { useClientNotificationsQuery } from "@/features/client-notifications/hooks/useClientNotificationsQuery";
import { useClientMarkAsRead } from "@/features/client-notifications/hooks/useClientMarkAsRead";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientPageShell } from "@/components/client/ClientPageShell";
import { ClientPageHeader } from "@/components/client/ClientPageHeader";

type FilterType = "all" | "unread";

export default function ClientNotifications() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("all");
  const { data: notifications = [], isLoading } = useClientNotificationsQuery();
  const { markAll } = useClientMarkAsRead();

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <ClientPageShell>
      <ClientPageHeader
        title="Notifiche"
        description="Le tue notifiche recenti"
      />

      {/* Filter bar */}
      <div className="flex items-center justify-between">
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
      <div>
        {isLoading ? (
          <div className="space-y-4">
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
            <p className="text-muted-foreground text-[15px] leading-6">
              {filter === "unread"
                ? "Nessuna notifica non letta"
                : "Nessuna notifica"}
            </p>
          </div>
        ) : (
          <ClientNotificationList
            notifications={filteredNotifications}
            variant="full"
            showGroupHeaders
          />
        )}
      </div>
    </ClientPageShell>
  );
}
