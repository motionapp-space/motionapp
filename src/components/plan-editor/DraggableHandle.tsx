import { GripVertical } from "lucide-react";
import { Level } from "./dnd-utils";

interface DraggableHandleProps {
  level: Level;
  disabled?: boolean;
  dragHandleProps?: any;
  className?: string;
}

/**
 * Unified draggable handle for all reorderable items
 * Ensures consistent touch-friendly sizing (≥32x32px) and DS-compliant styling
 */
export const DraggableHandle = ({
  level,
  disabled = false,
  dragHandleProps,
  className = "",
}: DraggableHandleProps) => {
  // Blocks are never draggable
  const isDraggable = level !== "block";
  const showHandle = isDraggable && !disabled;

  if (!showHandle) return null;

  return (
    <div
      {...dragHandleProps}
      className={`
        cursor-grab active:cursor-grabbing
        touch-none shrink-0
        flex items-center justify-center
        min-w-[32px] min-h-[32px]
        hover:bg-accent/50 rounded
        transition-colors
        ${className}
      `}
      role="button"
      tabIndex={0}
      aria-label="Trascina per riordinare"
      onKeyDown={(e) => {
        // Support keyboard activation (Space/Enter to grab)
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          dragHandleProps?.onKeyDown?.(e);
        }
      }}
    >
      <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
    </div>
  );
};
