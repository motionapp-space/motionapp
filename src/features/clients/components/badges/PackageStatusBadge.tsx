import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Package, AlertTriangle, XCircle, MinusCircle } from "lucide-react";

interface PackageStatusBadgeProps {
  status: "active" | "low" | "expired" | "none" | undefined;
  sessionsUsed?: number | null;
  sessionsTotal?: number | null;
}

export function PackageStatusBadge({ status, sessionsUsed, sessionsTotal }: PackageStatusBadgeProps) {
  if (!status) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const config = {
    active: {
      label: "Attivo",
      icon: Package,
      className: "border-green-500/50 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
    },
    low: {
      label: "In esaurimento",
      icon: AlertTriangle,
      className: "border-yellow-500/50 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
    },
    expired: {
      label: "Da rinnovare",
      icon: XCircle,
      className: "border-red-500/50 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
    },
    none: {
      label: "Nessuno",
      icon: MinusCircle,
      className: "border-gray-300 bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400"
    }
  };

  const { label, icon: Icon, className } = config[status];

  const badge = (
    <Badge variant="outline" className={cn("font-medium gap-1", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );

  // Se abbiamo i dati delle sessioni, mostriamo il tooltip
  if (sessionsUsed != null && sessionsTotal != null && status !== 'none') {
    const remaining = sessionsTotal - sessionsUsed;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {remaining}/{sessionsTotal} sessioni rimanenti
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
