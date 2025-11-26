import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { UserMenu } from "./UserMenu";
import { GlobalSessionCTA } from "./GlobalSessionCTA";

export function Topbar() {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border/60 bg-background px-6 shadow-sm">
      <div className="flex h-full items-center">
        {/* Spacer centrale */}
        <div className="flex-1" />
        
        {/* Azioni a destra */}
        <div className="flex items-center gap-3">
          <GlobalSessionCTA />
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
