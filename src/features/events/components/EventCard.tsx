import { formatTimeRange } from "../utils/calendar-utils";
import { getClientColor, getClientColorWithOpacity } from "../utils/client-colors";
import { cn } from "@/lib/utils";
import type { EventWithClient } from "../types";

interface EventCardProps {
  event: EventWithClient;
  onClick: () => void;
  compact?: boolean;
  // Positioning for continuous layout (optional)
  positioning?: {
    top: number;
    height: number;
    leftPercent: number;
    widthPercent: number;
  };
}

export function EventCard({ event, onClick, compact = false, positioning }: EventCardProps) {
  const bgColor = getClientColorWithOpacity(event.client_id, 0.15);
  const borderColor = getClientColor(event.client_id);

  const baseClasses = cn(
    "rounded-md border-2 p-2 cursor-pointer transition-all",
    "hover:shadow-md hover:scale-[1.02]",
    compact && "text-xs py-1 px-2"
  );

  const style: React.CSSProperties = {
    backgroundColor: bgColor,
    borderColor: borderColor,
    ...(positioning && {
      position: 'absolute',
      top: positioning.top,
      height: Math.max(24, positioning.height), // min 24px
      left: `${positioning.leftPercent * 100}%`,
      width: `${positioning.widthPercent * 100}%`,
    }),
  };

  return (
    <div
      onClick={onClick}
      style={style}
      className={baseClasses}
      role="button"
      aria-label={`${event.title} with ${event.client_name}`}
    >
      <div className="font-medium text-foreground truncate">{event.title}</div>
      <div className="text-xs text-muted-foreground truncate">{event.client_name}</div>
      {!compact && !positioning && (
        <div className="text-xs text-muted-foreground mt-1">
          {formatTimeRange(event.start_at, event.end_at, event.is_all_day)}
        </div>
      )}
    </div>
  );
}
