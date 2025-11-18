import { formatTimeRange } from "@/features/events/utils/calendar-utils";
import { colorClassesForClient } from "@/utils/clientColor";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import type { BookingRequestWithClient } from "../types";

interface BookingRequestCardProps {
  request: BookingRequestWithClient;
  onClick: () => void;
  positioning?: {
    top: number;
    height: number;
    leftPercent: number;
    widthPercent: number;
  };
}

export function BookingRequestCard({
  request,
  onClick,
  positioning,
}: BookingRequestCardProps) {
  const { bg, text, ring } = colorClassesForClient(request.client_id);

  const baseClasses = cn(
    "rounded-md p-2 cursor-pointer transition-all",
    "border-2 border-dashed opacity-60",
    "hover:opacity-80 hover:scale-[1.02]",
    bg,
    text,
    ring
  );

  const style: React.CSSProperties = positioning
    ? {
        position: "absolute",
        top: positioning.top,
        height: Math.max(24, positioning.height),
        left: `${positioning.leftPercent * 100}%`,
        width: `${positioning.widthPercent * 100}%`,
      }
    : {};

  return (
    <div
      onClick={onClick}
      style={style}
      className={baseClasses}
      role="button"
      aria-label={`Pending booking request: ${request.client_name}`}
    >
      <div className="flex items-center gap-1 mb-1">
        <Clock className="h-4 w-4" />
        <span className="font-semibold truncate text-xs">In attesa</span>
      </div>
      <div className="text-[11px] opacity-90 truncate">{request.client_name}</div>
      {!positioning && (
        <div className="text-[11px] opacity-90 mt-1">
          {formatTimeRange(
            request.requested_start_at,
            request.requested_end_at,
            false
          )}
        </div>
      )}
    </div>
  );
}
