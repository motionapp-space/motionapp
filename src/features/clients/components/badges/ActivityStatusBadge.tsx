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
      className: "border-green-500/50 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
    },
    low: {
      label: "Rallentato",
      icon: Clock,
      className: "border-yellow-500/50 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
    },
    inactive: {
      label: "Inattivo",
      icon: AlertCircle,
      className: "border-red-500/50 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
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
