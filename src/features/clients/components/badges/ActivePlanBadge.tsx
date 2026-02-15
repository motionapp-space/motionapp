import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle, MinusCircle } from "lucide-react";

interface ActivePlanBadgeProps {
  hasActivePlan: boolean | undefined;
}

export function ActivePlanBadge({ hasActivePlan }: ActivePlanBadgeProps) {
  if (hasActivePlan === undefined) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  if (hasActivePlan) {
    return (
      <Badge variant="outline" className={cn(
        "font-medium gap-1",
        "border-success/50 bg-success/10 text-foreground",
        "dark:bg-success/10 dark:text-success"
      )}>
        <CheckCircle className="h-3 w-3" />
        Attivo
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn(
      "font-medium gap-1",
      "border-border bg-muted text-muted-foreground"
    )}>
      <MinusCircle className="h-3 w-3" />
      Nessuno
    </Badge>
  );
}
