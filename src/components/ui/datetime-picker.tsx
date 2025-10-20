import * as React from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface DateTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

// Generate time options in 5-minute intervals
const generateTimeOptions = () => {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      options.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export function DateTimePicker({ value, onChange, placeholder = "Seleziona data e ora", disabled }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  
  // Parse the input value correctly
  const parseValue = (val: string | undefined) => {
    if (!val) return { date: undefined, time: "10:00" };
    try {
      // Handle both ISO string and datetime-local format
      const dateObj = new Date(val);
      if (isNaN(dateObj.getTime())) return { date: undefined, time: "10:00" };
      return {
        date: dateObj,
        time: format(dateObj, "HH:mm")
      };
    } catch {
      return { date: undefined, time: "10:00" };
    }
  };

  const initialValue = parseValue(value);
  const [date, setDate] = React.useState<Date | undefined>(initialValue.date);
  const [time, setTime] = React.useState<string>(initialValue.time);

  // Update internal state when value prop changes
React.useEffect(() => {
  const parsed = parseValue(value);
  setDate(parsed.date);
  setTime(parsed.time);
}, [value]);

const handleDateSelect = (selectedDate: Date | undefined) => {
  if (!selectedDate) return;
  setDate(selectedDate);
  // Combine date and time
  const [hours, minutes] = time.split(':').map(Number);
  const combined = new Date(selectedDate);
  combined.setHours(hours, minutes, 0, 0);
  onChange(combined.toISOString());
};

const handleTimeSelect = (selectedTime: string) => {
  setTime(selectedTime);
  if (date) {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    onChange(newDate.toISOString());
  }
};

const handleToday = () => {
  const now = new Date();
  setDate(now);
  const currentTime = format(now, "HH:mm");
  setTime(currentTime);
  onChange(now.toISOString());
};

  const handleClear = () => {
    setDate(undefined);
    setTime("10:00");
    onChange("");
    setOpen(false);
  };

  const displayValue = date
    ? `${format(date, "dd/MM/yyyy", { locale: it })}, ${time}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
<PopoverContent className="w-auto p-0 z-[60]" align="start">
  <div className="flex">
    {/* Calendar section */}
    <div className="border-r">
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleDateSelect}
        initialFocus
        locale={it}
        className={cn("p-3 pointer-events-auto")}
      />
      <div className="flex gap-2 px-3 pb-3 border-t pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="flex-1 text-primary"
        >
          Cancella
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToday}
          className="flex-1 text-primary"
        >
          Oggi
        </Button>
      </div>
    </div>

    {/* Time section */}
    <div className="w-28">
      <ScrollArea hoverScrollbars className="h-[340px]">
        <div className="p-2 space-y-1">
          {TIME_OPTIONS.map((timeOption) => (
            <button
              key={timeOption}
              onClick={() => handleTimeSelect(timeOption)}
              className={cn(
                "w-full text-center py-2 rounded text-sm hover:bg-muted transition-colors",
                time === timeOption && "bg-primary text-primary-foreground font-semibold"
              )}
            >
              {timeOption}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  </div>
</PopoverContent>
    </Popover>
  );
}
