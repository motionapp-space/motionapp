import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { UserMenu } from "./UserMenu";
import { GlobalSessionCTA } from "./GlobalSessionCTA";
import { useTopbarContext } from "@/contexts/TopbarContext";

export function Topbar() {
  const { title, showBack, onBack, actions } = useTopbarContext();

  return (
    <header className="sticky top-0 z-50 h-16 bg-background px-6">
      <div className="flex h-full items-center gap-4">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showBack && onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {title && (
            <h1 className="text-2xl font-semibold truncate">{title}</h1>
          )}
        </div>
        
        {/* Right: Actions + Global Session CTA + Notifications + User */}
        <div className="flex items-center gap-3 shrink-0">
          {actions}
          <GlobalSessionCTA />
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
