import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { UserMenu } from "./UserMenu";
import { useTopbarContext } from "@/contexts/TopbarContext";

interface TopbarProps {
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}

export function Topbar({ showMenuButton = false, onMenuClick }: TopbarProps) {
  const { title, showBack, onBack } = useTopbarContext();

  return (
    <header className="sticky top-0 z-50 h-16 bg-background px-6 border-b border-border/50">
      <div className="flex h-full items-center gap-4">
        {/* Left: Menu + Back + Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showMenuButton && onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="shrink-0"
              aria-label="Apri menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
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

        {/* Right: Global elements only */}
        <div className="flex items-center gap-3 shrink-0">
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
