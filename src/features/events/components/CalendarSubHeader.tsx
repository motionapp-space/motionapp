import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Eye, Plus, Search } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { CalendarView } from "../types";

type FilterOption = "all" | "approved" | "pending" | "ooo" | "availability";

interface CalendarSubHeaderProps {
  // Search
  searchQuery: string;
  onSearchChange: (value: string) => void;
  
  // Filters
  filterOption: FilterOption;
  onFilterChange: (option: FilterOption) => void;
  
  // CTAs
  pendingCount: number;
  onManageBookings: () => void;
  onNewEvent: () => void;
  
  // Navigation
  view: CalendarView;
  currentDate: Date;
  onViewChange: (view: CalendarView) => void;
  onDateChange: (date: Date) => void;
  onToday: () => void;
  
  // Client view
  showClientViewToggle?: boolean;
  isClientView?: boolean;
  onToggleClientView?: () => void;
}

export function CalendarSubHeader({
  searchQuery,
  onSearchChange,
  filterOption,
  onFilterChange,
  pendingCount,
  onManageBookings,
  onNewEvent,
  view,
  currentDate,
  onViewChange,
  onDateChange,
  onToday,
  showClientViewToggle = false,
  isClientView = false,
  onToggleClientView,
}: CalendarSubHeaderProps) {
  const isMobile = useIsMobile();

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
    if (view === "day") {
      return format(currentDate, "EEE d MMM", { locale: it });
    }
    
    if (view === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1, locale: it });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1, locale: it });
      const startDay = format(weekStart, "d");
      const endFormatted = format(weekEnd, "d MMM", { locale: it });
      return `${startDay}–${endFormatted}`;
    }
    
    if (view === "month") {
      return format(currentDate, "MMMM yyyy", { locale: it });
    }
    
    if (view === "year") {
      return format(currentDate, "yyyy", { locale: it });
    }
    
    return "";
  };

  // Mobile layout - fixed h-24 (two rows)
  if (isMobile) {
    return (
      <div className="sticky top-0 z-40 h-24 bg-background shrink-0 mb-2">
        {/* Row 1: Navigation - h-12 */}
        <div className="h-12 flex items-center justify-between px-3 border-b border-border/50">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={onToday} className="h-8 px-2 text-xs">
              Oggi
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="font-semibold text-sm capitalize">{getDateLabel()}</span>
          <Select value={view} onValueChange={(v) => onViewChange(v as CalendarView)}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Giorno</SelectItem>
              <SelectItem value="week">Settimana</SelectItem>
              <SelectItem value="month">Mese</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Row 2: Search + Actions - h-12 */}
        <div className="h-12 flex items-center gap-2 px-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cerca..."
              className="pl-8 h-8 text-sm"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onManageBookings}
            className="h-8 px-2 shrink-0"
          >
            {pendingCount > 0 ? (
              <Badge variant="secondary" className="h-5 min-w-5 px-1">{pendingCount}</Badge>
            ) : (
              <span className="text-xs">Gestione</span>
            )}
          </Button>
        </div>
        
        {/* FAB for new event */}
        <Button
          onClick={onNewEvent}
          className="fixed bottom-20 right-4 rounded-full w-14 h-14 shadow-lg z-50"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  // Desktop layout - FIXED h-12 (48px), sticky top-0 relative to AgendaViewport
  return (
    <div className="sticky top-0 z-40 h-12 bg-background shrink-0 mb-3">
      <div className="h-full flex items-center gap-3 px-4 max-w-[1440px] mx-auto">
        {/* Left: Search + Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca..."
              className="pl-8 w-44 h-9 text-sm"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Select value={filterOption} onValueChange={(v) => onFilterChange(v as FilterOption)}>
            <SelectTrigger className="w-28 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="approved">Approvati</SelectItem>
              <SelectItem value="pending">In attesa</SelectItem>
              <SelectItem value="ooo">Fuori ufficio</SelectItem>
              <SelectItem value="availability">Disponibilità</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Center: Navigation */}
        <div className="flex-1 flex items-center justify-center gap-1">
          <Button variant="outline" size="sm" onClick={onToday} className="h-9 px-3 text-sm">
            Oggi
          </Button>
          <Button variant="ghost" size="icon" onClick={handlePrev} className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNext} className="h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm ml-1 whitespace-nowrap capitalize min-w-[120px]">
            {getDateLabel()}
          </span>
        </div>

        {/* Right: CTAs + View */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onManageBookings}
            className="h-9 gap-1.5 text-sm"
          >
            Gestione prenotazioni
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
            )}
          </Button>

          <Button size="sm" onClick={onNewEvent} className="h-9 gap-1.5 text-sm">
            <Plus className="h-4 w-4" />
            Nuovo
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Select value={view} onValueChange={(v) => onViewChange(v as CalendarView)}>
            <SelectTrigger className="w-28 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Giorno</SelectItem>
              <SelectItem value="week">Settimana</SelectItem>
              <SelectItem value="month">Mese</SelectItem>
              <SelectItem value="year">Anno</SelectItem>
            </SelectContent>
          </Select>

          {showClientViewToggle && (
            <Button
              variant={isClientView ? "secondary" : "ghost"}
              size="icon"
              onClick={onToggleClientView}
              className={cn(
                "h-9 w-9",
                isClientView && "bg-primary/10 border border-primary text-primary"
              )}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}