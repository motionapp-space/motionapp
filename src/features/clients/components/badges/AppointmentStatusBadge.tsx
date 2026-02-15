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
      className: "border-success/50 bg-success/10 text-foreground dark:text-success"
    },
    unplanned: {
      label: "Da pianificare",
      icon: CalendarX,
      className: "border-warning/50 bg-warning/10 text-foreground dark:text-warning"
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
