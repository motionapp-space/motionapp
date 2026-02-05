import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
      <div className="rounded-full bg-muted p-4">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-base font-semibold leading-6">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground leading-5 max-w-md">
            {description}
          </p>
        )}
      </div>

      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}

      {secondaryAction && (
        <Button 
          variant="link" 
          size="sm" 
          onClick={secondaryAction.onClick}
          className="text-muted-foreground"
        >
          {secondaryAction.label}
        </Button>
      )}
    </div>
  );
}
