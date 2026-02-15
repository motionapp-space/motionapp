import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Activity, Clock, AlertCircle } from "lucide-react";

interface ActivityStatusBadgeProps {
  status: "active" | "low" | "inactive" | undefined;
}

export function ActivityStatusBadge({ status }: ActivityStatusBadgeProps) {
  if (!status) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const config = {
    active: {
      label: "Attivo",
      icon: Activity,
      className: "border-success/50 bg-success/10 text-foreground dark:text-success"
    },
    low: {
      label: "Bassa",
      icon: Clock,
      className: "border-warning/50 bg-warning/10 text-foreground dark:text-warning"
    },
    inactive: {
      label: "Assente",
      icon: AlertCircle,
      className: "border-destructive/50 bg-destructive/10 text-foreground dark:text-destructive"
    }
  };

  const { label, icon: Icon, className } = config[status];

  return (
    <Badge variant="outline" className={cn("font-medium gap-1", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
