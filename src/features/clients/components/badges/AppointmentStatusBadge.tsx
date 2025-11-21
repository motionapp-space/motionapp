import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Calendar, CalendarX } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface AppointmentStatusBadgeProps {
  status: "planned" | "unplanned" | undefined;
  nextAppointmentDate?: string | null;
}

export function AppointmentStatusBadge({ status, nextAppointmentDate }: AppointmentStatusBadgeProps) {
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

  const badge = (
    <Badge variant="outline" className={cn("font-medium gap-1", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );

  // Se c'è una data e lo status è 'planned', mostriamo il tooltip
  if (status === 'planned' && nextAppointmentDate) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Prossimo appuntamento:<br/>
            <span className="font-semibold">
              {format(new Date(nextAppointmentDate), "PPp", { locale: it })}
            </span>
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
