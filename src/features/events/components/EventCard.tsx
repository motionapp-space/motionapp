import { formatTimeRange } from "../utils/calendar-utils";
import { colorClassesForClient } from "@/utils/clientColor";
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
  const { bg, text, ring } = colorClassesForClient(event.client_id);

  const baseClasses = cn(
    "rounded-md p-2 cursor-pointer transition-all shadow-sm",
    "hover:shadow-md hover:scale-[1.02]",
    bg,
    text,
    `ring-1 ${ring}`,
    compact && "text-xs py-1 px-2"
  );

  const style: React.CSSProperties = positioning ? {
    position: 'absolute',
    top: positioning.top,
    height: Math.max(24, positioning.height),
    left: `${positioning.leftPercent * 100}%`,
    width: `${positioning.widthPercent * 100}%`,
  } : {};

  return (
    <div
      onClick={onClick}
      style={style}
      className={baseClasses}
      role="button"
      aria-label={`${event.title} with ${event.client_name}`}
    >
      <div className="font-semibold truncate text-xs">{event.title}</div>
      <div className="text-[11px] opacity-90 truncate">{event.client_name}</div>
      {!compact && !positioning && (
        <div className="text-[11px] opacity-90 mt-1">
          {formatTimeRange(event.start_at, event.end_at, event.is_all_day)}
        </div>
      )}
    </div>
  );
}
