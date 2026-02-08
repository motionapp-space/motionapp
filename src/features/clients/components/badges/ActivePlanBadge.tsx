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
        "border-green-500/50 bg-green-50 text-green-700",
        "dark:bg-green-950 dark:text-green-300"
      )}>
        <CheckCircle className="h-3 w-3" />
        Attivo
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn(
      "font-medium gap-1",
      "border-gray-300 bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400"
    )}>
      <MinusCircle className="h-3 w-3" />
      Nessuno
    </Badge>
  );
}
