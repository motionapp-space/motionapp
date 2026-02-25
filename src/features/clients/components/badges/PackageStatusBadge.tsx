import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
      className: "border-success/50 bg-success/10 text-foreground dark:text-success"
    },
    low: {
      label: "In esaurimento",
      icon: AlertTriangle,
      className: "border-warning/50 bg-warning/10 text-foreground dark:text-warning"
    },
    expired: {
      label: "Da rinnovare",
      icon: XCircle,
      className: "border-destructive/50 bg-destructive/10 text-foreground dark:text-destructive"
    },
    none: {
      label: "Nessuno",
      icon: MinusCircle,
      className: "border-muted-foreground/50 bg-muted-foreground/10 text-foreground dark:text-muted-foreground"
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
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {remaining}/{sessionsTotal} sessioni rimanenti
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
