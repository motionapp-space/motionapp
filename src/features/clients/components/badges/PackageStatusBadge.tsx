import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Package, AlertTriangle, XCircle, MinusCircle } from "lucide-react";

interface PackageStatusBadgeProps {
  status: "active" | "low" | "expired" | "none" | undefined;
}

export function PackageStatusBadge({ status }: PackageStatusBadgeProps) {
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

  return (
    <Badge variant="outline" className={cn("font-medium gap-1", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
