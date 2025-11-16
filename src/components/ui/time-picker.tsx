import * as React from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Generate time options in 5-minute intervals
const generateTimeOptions = (): string[] => {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      const hour = h.toString().padStart(2, "0");
      const minute = m.toString().padStart(2, "0");
      times.push(`${hour}:${minute}`);
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TimePicker({
  value,
  onChange,
  disabled,
  placeholder = "Seleziona orario",
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleTimeSelect = (time: string) => {
    onChange(time);
    setOpen(false);
  };

  // Format value to display (remove seconds if present)
  const displayValue = value ? value.substring(0, 5) : "";

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
      <PopoverContent className="w-auto p-0" align="start">
        <ScrollArea className="h-[280px]">
          <div className="p-2">
            {TIME_OPTIONS.map((time) => (
              <Button
                key={time}
                variant="ghost"
                className={cn(
                  "w-full justify-start font-mono text-sm",
                  time === displayValue && "bg-accent"
                )}
                onClick={() => handleTimeSelect(time)}
              >
                {time}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
