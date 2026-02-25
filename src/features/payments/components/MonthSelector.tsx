import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: Date;
  onChange: (month: Date) => void;
  variant?: "default" | "light";
}

function buildMonthOptions(): Date[] {
  const now = new Date();
  const months: Date[] = [];
  for (let i = 0; i < 7; i++) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }
  return months;
}

export function MonthSelector({ value, onChange, variant = "default" }: Props) {
  const [open, setOpen] = useState(false);
  const months = buildMonthOptions();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-full text-sm gap-1",
            variant === "light"
              ? "text-white/80 hover:text-white hover:bg-white/10"
              : ""
          )}
        >
          {format(value, "MMM yyyy", { locale: it })}
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="end">
        <div className="flex flex-col">
          {months.map((m) => {
            const label = format(m, "MMM yyyy", { locale: it });
            const isActive =
              m.getFullYear() === value.getFullYear() &&
              m.getMonth() === value.getMonth();
            return (
              <button
                key={label}
                className={`text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "hover:bg-accent/50"
                }`}
                onClick={() => {
                  onChange(m);
                  setOpen(false);
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
