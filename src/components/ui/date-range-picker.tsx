import * as React from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { X } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DateRange | undefined>(value);

  // Sync draft when popover opens
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraft(value);
    }
    setOpen(nextOpen);
  };

  // Sync draft when value changes externally while closed (e.g. chip reset)
  React.useEffect(() => {
    if (!open) {
      setDraft(value);
    }
  }, [value, open]);

  const handleApply = () => {
    onChange(draft);
    setOpen(false);
  };

  const handleClear = () => {
    setDraft(undefined);
    setOpen(false);
    // Only call onChange if value wasn't already undefined
    if (value?.from || value?.to) {
      onChange(undefined);
    }
  };

  const handleResetX = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(undefined);
  };

  const handleResetXMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const hasValue = value?.from || value?.to;
  const hasDraft = draft?.from || draft?.to;
  const canApply = !!draft?.from && !!draft?.to;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-9 rounded-full border border-border bg-background px-3 text-sm flex items-center gap-2 hover:bg-accent/50 transition-colors",
            className
          )}
        >
          {/* Start segment */}
          <span className={cn(value?.from ? "text-foreground" : "text-muted-foreground")}>
            Dal {value?.from ? format(value.from, "dd MMM yyyy", { locale: it }) : "—"}
          </span>

          {/* Divider */}
          <span className="h-4 w-px bg-border" />

          {/* End segment */}
          <span className={cn(value?.to ? "text-foreground" : "text-muted-foreground")}>
            Al {value?.to ? format(value.to, "dd MMM yyyy", { locale: it }) : "—"}
          </span>

          {/* Reset X */}
          {hasValue && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Azzera periodo"
              onMouseDown={handleResetXMouseDown}
              onClick={handleResetX}
              className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        {/* Hint */}
        <div className="px-4 pt-3 pb-1 space-y-1">
          <p className="text-xs text-muted-foreground">
            Seleziona una data di inizio e una di fine
          </p>
          {draft?.from && !draft?.to && (
            <p className="text-xs text-muted-foreground font-medium">
              Seleziona anche la data di fine
            </p>
          )}
        </div>

        {/* Calendar */}
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={draft?.from ?? value?.from}
          selected={draft}
          onSelect={setDraft}
          numberOfMonths={2}
          locale={it}
          className="p-3 pointer-events-auto"
        />

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasDraft}
            onClick={handleClear}
          >
            Azzera
          </Button>
          <Button
            size="sm"
            disabled={!canApply}
            onClick={handleApply}
          >
            Applica
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
