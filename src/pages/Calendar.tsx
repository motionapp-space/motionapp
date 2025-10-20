import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { parseISO, format, startOfMonth } from "date-fns";
import { Input } from "@/components/ui/input";
import { Search, Calendar as CalendarIcon } from "lucide-react";
import { useEventsQuery } from "@/features/events/hooks/useEventsQuery";
import { CalendarToolbar } from "@/features/events/components/CalendarToolbar";
import { DayView } from "@/features/events/components/DayView";
import { WeekView } from "@/features/events/components/WeekView";
import { MonthView } from "@/features/events/components/MonthView";
import { YearView } from "@/features/events/components/YearView";
import { EventModal } from "@/features/events/components/EventModal";
import { useDebounce } from "@/hooks/use-debounce";
import type { CalendarView, EventWithClient } from "@/features/events/types";

const Calendar = () => {
  const [sp, setSp] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(() => {
    const dateParam = sp.get("date");
    return dateParam ? parseISO(dateParam) : new Date();
  });
  const [view, setView] = useState<CalendarView>((sp.get("view") as CalendarView) || "week");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithClient | undefined>();
  const [prefillData, setPrefillData] = useState<any>();

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Update URL when view or date changes
  const handleViewChange = (newView: CalendarView) => {
    setView(newView);
    sp.set("view", newView);
    setSp(sp);
  };

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
    sp.set("date", format(newDate, "yyyy-MM-dd"));
    setSp(sp);
  };

  const handleToday = () => {
    handleDateChange(new Date());
  };

  // Fetch events for the visible range
  const { data: events = [], isLoading } = useEventsQuery({
    q: debouncedSearch,
  });

  // Filter events based on search
  const filteredEvents = useMemo(() => {
    if (!debouncedSearch) return events;
    const query = debouncedSearch.toLowerCase();
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.client_name.toLowerCase().includes(query)
    );
  }, [events, debouncedSearch]);

  const handleEventClick = (event: EventWithClient) => {
    setSelectedEvent(event);
    setPrefillData(undefined);
    setModalOpen(true);
  };

  const handleNewEvent = () => {
    setSelectedEvent(undefined);
    setPrefillData({
      start: new Date(currentDate.setHours(9, 0)),
      end: new Date(currentDate.setHours(10, 0)),
    });
    setModalOpen(true);
  };

  const handleMonthClick = (month: Date) => {
    setView("month");
    setCurrentDate(month);
    sp.set("view", "month");
    sp.set("date", format(month, "yyyy-MM-dd"));
    setSp(sp);
  };

  return (
    <div className="h-screen flex flex-col bg-background w-full">
      {/* Header with search */}
      <header className="border-b bg-card shadow-sm">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex items-center justify-between gap-4 py-4">
            <h1 className="text-2xl font-semibold">Calendario</h1>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca appuntamenti..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar with lateral padding */}
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <CalendarToolbar
          view={view}
          currentDate={currentDate}
          onViewChange={handleViewChange}
          onDateChange={handleDateChange}
          onToday={handleToday}
          onNewEvent={handleNewEvent}
        />
      </div>

      {/* Calendar Views with lateral padding */}
      <div className="flex-1 overflow-hidden mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : filteredEvents.length === 0 && searchQuery ? (
          <div className="flex h-full items-center justify-center text-center py-16">
            <div>
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nessun appuntamento trovato</p>
            </div>
          </div>
        ) : (
          <>
            {view === "day" && (
              <DayView
                date={currentDate}
                events={filteredEvents}
                onEventClick={handleEventClick}
              />
            )}
            {view === "week" && (
              <WeekView
                date={currentDate}
                events={filteredEvents}
                onEventClick={handleEventClick}
              />
            )}
            {view === "month" && (
              <MonthView
                date={currentDate}
                events={filteredEvents}
                onEventClick={handleEventClick}
              />
            )}
            {view === "year" && (
              <YearView
                date={currentDate}
                events={filteredEvents}
                onMonthClick={handleMonthClick}
              />
            )}
          </>
        )}
      </div>

      {/* Event Modal */}
      <EventModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        event={selectedEvent}
        prefillData={prefillData}
      />
    </div>
  );
};

export default Calendar;
