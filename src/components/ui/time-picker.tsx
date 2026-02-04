import * as React from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Generate time options with configurable interval and range
const generateTimeOptions = (
  interval: number = 5,
  startHour: number = 0,
  endHour: number = 24
): string[] => {
  const times: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += interval) {
      const hour = h.toString().padStart(2, "0");
      const minute = m.toString().padStart(2, "0");
      times.push(`${hour}:${minute}`);
    }
  }
  return times;
};

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  interval?: 5 | 15 | 30; // Interval in minutes
  startHour?: number; // Start hour (0-23)
  endHour?: number; // End hour (1-24)
}

export function TimePicker({
  value,
  onChange,
  disabled,
  placeholder = "Seleziona orario",
  interval = 5,
  startHour = 0,
  endHour = 24,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Generate time options based on props
  const TIME_OPTIONS = React.useMemo(
    () => generateTimeOptions(interval, startHour, endHour),
    [interval, startHour, endHour]
  );

  const handleTimeSelect = (time: string) => {
    onChange(time);
    setOpen(false);
  };

  // Format value to display (remove seconds if present)
  const displayValue = value ? value.substring(0, 5) : "";

  // Auto-scroll to selected time when popover opens
  React.useEffect(() => {
    if (open && scrollRef.current && displayValue) {
      const selectedIndex = TIME_OPTIONS.indexOf(displayValue);
      if (selectedIndex >= 0) {
        // Each button is approximately 40px (py-2.5 + text)
        const itemHeight = 40;
        // Center the selected item in the scroll area (280px height)
        const scrollPosition = Math.max(0, selectedIndex * itemHeight - 120);
        
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollPosition;
          }
        }, 0);
      }
    }
  }, [open, displayValue, TIME_OPTIONS]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[160px] p-0 z-[100]" align="start" sideOffset={4}>
        <div 
          ref={scrollRef}
          className="h-[280px] overflow-y-scroll overscroll-contain"
        >
          <div className="p-1">
            {TIME_OPTIONS.map((time) => (
              <button
                key={time}
                onClick={() => handleTimeSelect(time)}
                className={cn(
                  "w-full py-2.5 px-3 rounded-md text-sm font-medium text-left transition-colors",
                  time === displayValue
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
