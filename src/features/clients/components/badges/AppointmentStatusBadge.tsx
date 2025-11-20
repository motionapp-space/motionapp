import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar, CalendarX } from "lucide-react";

interface AppointmentStatusBadgeProps {
  status: "planned" | "unplanned" | undefined;
}

export function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
  if (!status) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const config = {
    planned: {
      label: "Pianificato",
      icon: Calendar,
      className: "border-green-500/50 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
    },
    unplanned: {
      label: "Da pianificare",
      icon: CalendarX,
      className: "border-yellow-500/50 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
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
