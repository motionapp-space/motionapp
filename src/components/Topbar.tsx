import { ArrowLeft, Menu, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { UserMenu } from "./UserMenu";
import { useTopbarContext } from "@/contexts/TopbarContext";

interface TopbarProps {
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}

export function Topbar({ showMenuButton = false, onMenuClick }: TopbarProps) {
  const { title, subtitle, showBack, onBack, showLegendIcon, onLegendClick } = useTopbarContext();

  return (
    <header className="sticky top-0 z-50 h-16 bg-background px-5 border-b border-border">
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
              className="shrink-0 h-8 w-8 border border-border hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {title && (
            <div className="flex flex-col min-w-0">
              <h1 className="text-[20px] font-semibold leading-[28px] tracking-[-0.01em] text-foreground truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-[2px] text-[12px] leading-[16px] text-muted-foreground truncate">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right: Legend icon + Global elements */}
        <div className="flex items-center gap-3 shrink-0">
          {showLegendIcon && onLegendClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onLegendClick}
              className="shrink-0"
              aria-label="Legenda"
            >
              <Info className="h-5 w-5" />
            </Button>
          )}
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
