import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Package, AlertTriangle, XCircle } from "lucide-react";

interface PackageStatusBadgeProps {
  status: "active" | "low" | "expired" | "none" | undefined;
}

export function PackageStatusBadge({ status }: PackageStatusBadgeProps) {
  if (!status || status === "none") {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const config = {
    active: {
      label: "Attivo",
      icon: Package,
      className: "border-green-500/50 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
    },
    low: {
      label: "Basso",
      icon: AlertTriangle,
      className: "border-yellow-500/50 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
    },
    expired: {
      label: "Scaduto",
      icon: XCircle,
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
