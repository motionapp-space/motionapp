import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClientEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "ghost" | "outline";
  };
  className?: string;
}

export function ClientEmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}: ClientEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 py-8 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1 max-w-xs">
        <p className="text-base font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-[15px] leading-6 text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <Button 
          variant={action.variant || "ghost"} 
          onClick={action.onClick}
          className="mt-2"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
