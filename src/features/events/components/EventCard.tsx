import { formatTimeRange } from "../utils/calendar-utils";
import { cn } from "@/lib/utils";
import type { EventWithClient } from "../types";

interface EventCardProps {
  event: EventWithClient;
  onClick: () => void;
  compact?: boolean;
}

export function EventCard({ event, onClick, compact = false }: EventCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-md border border-primary/20 bg-primary/10 p-2 cursor-pointer",
        "hover:bg-primary/20 transition-colors",
        compact && "text-xs py-1 px-2"
      )}
    >
      <div className="font-medium text-foreground truncate">{event.title}</div>
      <div className="text-xs text-muted-foreground truncate">{event.client_name}</div>
      {!compact && (
        <div className="text-xs text-muted-foreground mt-1">
          {formatTimeRange(event.start_at, event.end_at, event.is_all_day)}
        </div>
      )}
    </div>
  );
}
