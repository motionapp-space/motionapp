import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { CalendarView } from "../types";

interface CalendarToolbarProps {
  view: CalendarView;
  currentDate: Date;
  onViewChange: (view: CalendarView) => void;
  onDateChange: (date: Date) => void;
  onToday: () => void;
}

export function CalendarToolbar({
  view,
  currentDate,
  onViewChange,
  onDateChange,
  onToday,
}: CalendarToolbarProps) {
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === "day") newDate.setDate(newDate.getDate() - 1);
    else if (view === "week") newDate.setDate(newDate.getDate() - 7);
    else if (view === "month") newDate.setMonth(newDate.getMonth() - 1);
    else if (view === "year") newDate.setFullYear(newDate.getFullYear() - 1);
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === "day") newDate.setDate(newDate.getDate() + 1);
    else if (view === "week") newDate.setDate(newDate.getDate() + 7);
    else if (view === "month") newDate.setMonth(newDate.getMonth() + 1);
    else if (view === "year") newDate.setFullYear(newDate.getFullYear() + 1);
    onDateChange(newDate);
  };

  const getDateLabel = () => {
    if (view === "day") return format(currentDate, "EEEE, d MMMM yyyy", { locale: it });
    if (view === "week") return format(currentDate, "MMMM yyyy", { locale: it });
    if (view === "month") return format(currentDate, "MMMM yyyy", { locale: it });
    if (view === "year") return format(currentDate, "yyyy", { locale: it });
    return "";
  };

  return (
    <div className="border-b bg-card">
      <div className="py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onToday} className="h-9 px-3">
              Oggi
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrev} className="h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext} className="h-9 w-9">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-semibold ml-2 capitalize">
              {getDateLabel()}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Select value={view} onValueChange={(v) => onViewChange(v as CalendarView)}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Giorno</SelectItem>
                <SelectItem value="week">Settimana</SelectItem>
                <SelectItem value="month">Mese</SelectItem>
                <SelectItem value="year">Anno</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
