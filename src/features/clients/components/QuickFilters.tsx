import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export type QuickFilterType = 
  | "plan_expiring" 
  | "package_low" 
  | "package_expired" 
  | "no_appointments" 
  | "inactive";

interface QuickFiltersProps {
  activeFilters: QuickFilterType[];
  onToggleFilter: (filter: QuickFilterType) => void;
}

const QUICK_FILTERS = [
  { id: "plan_expiring" as QuickFilterType, label: "Piano in scadenza (9+ sett.)" },
  { id: "package_low" as QuickFilterType, label: "Pacchetto basso" },
  { id: "package_expired" as QuickFilterType, label: "Pacchetto scaduto" },
  { id: "no_appointments" as QuickFilterType, label: "Senza appuntamenti" },
  { id: "inactive" as QuickFilterType, label: "Inattivi (14+ giorni)" }
];

export function QuickFilters({ activeFilters, onToggleFilter }: QuickFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_FILTERS.map((filter) => {
        const isActive = activeFilters.includes(filter.id);
        return (
          <Badge
            key={filter.id}
            variant={isActive ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-colors gap-1 hover:bg-primary/90",
              !isActive && "hover:bg-secondary"
            )}
            onClick={() => onToggleFilter(filter.id)}
          >
            {filter.label}
            {isActive && <X className="h-3 w-3" />}
          </Badge>
        );
      })}
    </div>
  );
}
