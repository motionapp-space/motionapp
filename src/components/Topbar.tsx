import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { UserMenu } from "./UserMenu";
import { GlobalSessionCTA } from "./GlobalSessionCTA";

export function Topbar() {
  return (
    <header className="sticky top-0 z-50 h-16 border-b bg-background">
      <div className="flex h-full items-center justify-end gap-3 px-6">
        <GlobalSessionCTA />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
