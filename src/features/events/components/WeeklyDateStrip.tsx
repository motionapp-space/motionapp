import { format, addDays, startOfWeek, isSameDay, isToday, isWeekend } from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface WeeklyDateStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  slotCounts?: Record<string, number>; // ISO date string -> count
}

export function WeeklyDateStrip({ selectedDate, onDateSelect, slotCounts = {} }: WeeklyDateStripProps) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 14 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
      {days.map((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const slotCount = slotCounts[dateKey] || 0;
        const hasSlots = slotCount > 0;
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentDay = isToday(day);
        const isWeekendDay = isWeekend(day);

        return (
          <Button
            key={dateKey}
            type="button"
            variant={isSelected ? "default" : "outline"}
            className={cn(
              "flex-shrink-0 flex flex-col items-center gap-1 h-auto py-3 px-4 min-w-[70px]",
              !hasSlots && "opacity-40 cursor-not-allowed",
              isWeekendDay && "bg-muted/50",
              isCurrentDay && !isSelected && "ring-2 ring-primary/50"
            )}
            onClick={() => hasSlots && onDateSelect(day)}
            disabled={!hasSlots}
            aria-label={`${format(day, "EEEE d MMMM", { locale: it })}, ${slotCount} slot disponibili`}
          >
            <span className="text-xs font-medium uppercase text-muted-foreground">
              {format(day, "EEE", { locale: it })}
            </span>
            <span className="text-lg font-semibold">
              {format(day, "d")}
            </span>
            {hasSlots && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                {slotCount}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}
