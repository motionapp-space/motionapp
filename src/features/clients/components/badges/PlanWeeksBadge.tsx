import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PlanWeeksBadgeProps {
  weeks: number | null | undefined;
}

export function PlanWeeksBadge({ weeks }: PlanWeeksBadgeProps) {
  if (weeks === null || weeks === undefined) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  // Verde: 0-4 settimane (piano recente)
  // Giallo: 5-8 settimane (da monitorare)
  // Rosso: 9+ settimane (scaduto/critico)
  const variant = weeks <= 4 ? "success" : weeks <= 8 ? "warning" : "destructive";
  const label = weeks >= 10 ? "10+ sett." : `${weeks} sett.`;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium",
        variant === "success" && "border-green-500/50 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
        variant === "warning" && "border-yellow-500/50 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
        variant === "destructive" && "border-red-500/50 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
      )}
    >
      {label}
    </Badge>
  );
}
