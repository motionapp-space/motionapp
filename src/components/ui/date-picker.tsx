import * as React from "react";
import { format, addMonths, subMonths } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronUp, ChevronDown } from "lucide-react";

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({ value, onChange, placeholder = "Seleziona data", disabled }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  
  // Parse the input value correctly
  const parseValue = (val: string | undefined) => {
    if (!val) return undefined;
    try {
      const dateObj = new Date(val);
      if (isNaN(dateObj.getTime())) return undefined;
      return dateObj;
    } catch {
      return undefined;
    }
  };

  const initialValue = parseValue(value);
  const [date, setDate] = React.useState<Date | undefined>(initialValue);
  const [displayMonth, setDisplayMonth] = React.useState<Date>(date || new Date());

  // Update internal state when value prop changes
  React.useEffect(() => {
    const parsed = parseValue(value);
    setDate(parsed);
    if (parsed) setDisplayMonth(parsed);
  }, [value]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    setDate(selectedDate);
    setDisplayMonth(selectedDate);
    onChange(format(selectedDate, "yyyy-MM-dd"));
    setOpen(false);
  };

  const handleToday = () => {
    const now = new Date();
    setDate(now);
    setDisplayMonth(now);
    onChange(format(now, "yyyy-MM-dd"));
  };

  const handleClear = () => {
    setDate(undefined);
    onChange("");
    setOpen(false);
  };

  const displayValue = date
    ? format(date, "dd/MM/yyyy", { locale: it })
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
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <button
            onClick={() => setDisplayMonth(subMonths(displayMonth, 1))}
            className="p-1 hover:bg-muted rounded"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <span className="font-medium">
            {format(displayMonth, "MMMM yyyy", { locale: it })}
          </span>
          <button
            onClick={() => setDisplayMonth(addMonths(displayMonth, 1))}
            className="p-1 hover:bg-muted rounded"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          initialFocus
          locale={it}
          className={cn("p-3 pointer-events-auto")}
          classNames={{
            caption: "hidden"
          }}
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
      </PopoverContent>
    </Popover>
  );
}
