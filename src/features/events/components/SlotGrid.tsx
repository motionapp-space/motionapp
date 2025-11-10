import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { AvailableSlot } from "@/features/bookings/types";

interface SlotGridProps {
  slots: AvailableSlot[];
  selectedSlot: AvailableSlot | null;
  onSlotSelect: (slot: AvailableSlot) => void;
  isLoading?: boolean;
}

export function SlotGrid({ slots, selectedSlot, onSlotSelect, isLoading }: SlotGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (slots.length === 0) {
    return null;
  }

  const isSlotSelected = (slot: AvailableSlot) => {
    if (!selectedSlot) return false;
    return slot.start === selectedSlot.start && slot.end === selectedSlot.end;
  };

  const formatSlotTime = (slot: AvailableSlot) => {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    return `${format(start, "HH:mm")}–${format(end, "HH:mm")}`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      {slots.map((slot, index) => (
        <Button
          key={`${slot.start}-${index}`}
          type="button"
          variant={isSlotSelected(slot) ? "default" : "outline"}
          className={cn(
            "h-auto py-3 px-4 text-sm font-normal transition-all hover:scale-105",
            isSlotSelected(slot) && "ring-2 ring-primary ring-offset-2 scale-105"
          )}
          onClick={() => onSlotSelect(slot)}
        >
          {formatSlotTime(slot)}
        </Button>
      ))}
    </div>
  );
}
