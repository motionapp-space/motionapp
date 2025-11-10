import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TimeOfDay = "morning" | "afternoon" | "evening" | null;

interface SlotFiltersProps {
  selectedTimeOfDay: TimeOfDay;
  onTimeOfDayChange: (time: TimeOfDay) => void;
}

const timeFilters = [
  { value: "morning" as const, label: "Mattina", range: "06:00-12:00" },
  { value: "afternoon" as const, label: "Pomeriggio", range: "12:00-18:00" },
  { value: "evening" as const, label: "Sera", range: "18:00-23:00" },
];

export function SlotFilters({ selectedTimeOfDay, onTimeOfDayChange }: SlotFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant={selectedTimeOfDay === null ? "default" : "outline"}
        className={cn(
          "cursor-pointer transition-all hover:scale-105",
          selectedTimeOfDay === null && "ring-2 ring-primary ring-offset-2"
        )}
        onClick={() => onTimeOfDayChange(null)}
      >
        Tutti
      </Badge>
      {timeFilters.map((filter) => (
        <Badge
          key={filter.value}
          variant={selectedTimeOfDay === filter.value ? "default" : "outline"}
          className={cn(
            "cursor-pointer transition-all hover:scale-105",
            selectedTimeOfDay === filter.value && "ring-2 ring-primary ring-offset-2"
          )}
          onClick={() => onTimeOfDayChange(filter.value)}
        >
          {filter.label}
          <span className="ml-1 text-xs opacity-70">({filter.range})</span>
        </Badge>
      ))}
    </div>
  );
}
