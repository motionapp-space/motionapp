import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { UserMenu } from "./UserMenu";
import { GlobalSessionCTA } from "./GlobalSessionCTA";

export function Topbar() {
  return (
    <header className="sticky top-0 z-50 h-16 border-b bg-background px-6">
      <div className="flex h-full items-center">
        {/* Logo a sinistra */}
        <div className="flex items-center">
          <span className="text-xl font-semibold tracking-tight">Studio AI</span>
        </div>
        
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
