import { useMemo } from "react";
import { parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { minutesFromDayStart, MINUTE_HEIGHT } from "@/features/events/utils/time";
import type { OutOfOfficeBlock } from "../types";

interface OutOfOfficeOverlayProps {
  date: Date;
  blocks: OutOfOfficeBlock[];
}

export function OutOfOfficeOverlay({ date, blocks }: OutOfOfficeOverlayProps) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const overlayBlocks = useMemo(() => {
    return blocks
      .filter((block) => {
        const blockStart = parseISO(block.start_at);
        const blockEnd = parseISO(block.end_at);
        return (
          isWithinInterval(blockStart, { start: dayStart, end: dayEnd }) ||
          isWithinInterval(blockEnd, { start: dayStart, end: dayEnd }) ||
          (blockStart <= dayStart && blockEnd >= dayEnd)
        );
      })
      .map((block) => {
        const blockStart = parseISO(block.start_at);
        const blockEnd = parseISO(block.end_at);

        const displayStart = blockStart < dayStart ? dayStart : blockStart;
        const displayEnd = blockEnd > dayEnd ? dayEnd : blockEnd;

        const top = minutesFromDayStart(displayStart) * MINUTE_HEIGHT;
        const height =
          (minutesFromDayStart(displayEnd) - minutesFromDayStart(displayStart)) *
          MINUTE_HEIGHT;

        return {
          id: block.id,
          top,
          height,
          reason: block.reason,
        };
      });
  }, [blocks, date, dayStart, dayEnd]);

  if (overlayBlocks.length === 0) return null;

  return (
    <>
      {overlayBlocks.map((block) => (
        <div
          key={block.id}
          className="absolute inset-x-0 bg-muted/60 border-l-4 border-muted-foreground/40 pointer-events-none"
          style={{
            top: block.top,
            height: block.height,
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,.05) 10px, rgba(0,0,0,.05) 20px)",
          }}
        >
          {block.reason && block.height > 30 && (
            <div className="px-2 py-1 text-xs text-muted-foreground">
              {block.reason}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
