import { formatTimeRange } from "../utils/calendar-utils";
import { getClientColor, getClientColorWithOpacity } from "../utils/client-colors";
import { cn } from "@/lib/utils";
import type { EventWithClient } from "../types";

interface EventCardProps {
  event: EventWithClient;
  onClick: () => void;
  compact?: boolean;
}

export function EventCard({ event, onClick, compact = false }: EventCardProps) {
  const bgColor = getClientColorWithOpacity(event.client_id, 0.15);
  const borderColor = getClientColor(event.client_id);

  return (
    <div
      onClick={onClick}
      style={{ 
        backgroundColor: bgColor,
        borderColor: borderColor,
      }}
      className={cn(
        "rounded-md border-2 p-2 cursor-pointer transition-all",
        "hover:shadow-md hover:scale-[1.02]",
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
