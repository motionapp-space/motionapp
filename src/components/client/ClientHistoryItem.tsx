import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ClientHistoryItemProps {
  title: string;
  subtitle?: string;
  date: string;
  time?: string;
  badge?: {
    label: string;
    variant?: "default" | "secondary" | "outline" | "destructive";
    icon?: LucideIcon;
  };
  onClick?: () => void;
  className?: string;
}

export function ClientHistoryItem({ 
  title, 
  subtitle,
  date, 
  time, 
  badge,
  onClick,
  className 
}: ClientHistoryItemProps) {
  const Wrapper = onClick ? 'button' : 'div';
  
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between gap-3 py-3.5 text-left transition-colors",
        onClick && "hover:bg-accent/30 cursor-pointer -mx-2 px-2 rounded-lg",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-muted-foreground">{date}</span>
          {time && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{time}</span>
            </>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {badge && (
        <Badge 
          variant={badge.variant || "secondary"} 
          className="text-xs flex-shrink-0 h-6"
        >
          {badge.icon && <badge.icon className="h-3 w-3 mr-1" />}
          {badge.label}
        </Badge>
      )}
    </Wrapper>
  );
}
