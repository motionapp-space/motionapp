import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { parseISO, format, startOfMonth } from "date-fns";
import { Input } from "@/components/ui/input";
import { Search, Calendar as CalendarIcon, Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useEventsQuery } from "@/features/events/hooks/useEventsQuery";
import { CalendarToolbar } from "@/features/events/components/CalendarToolbar";
import { DayView } from "@/features/events/components/DayView";
import { WeekView } from "@/features/events/components/WeekView";
import { MonthView } from "@/features/events/components/MonthView";
import { YearView } from "@/features/events/components/YearView";
import { EventModal } from "@/features/events/components/EventModal";
import { useDebounce } from "@/hooks/use-debounce";
import { CalendarLayerFilters, CalendarLayers } from "@/features/bookings/components/CalendarLayerFilters";
import { BookingRequestDrawer } from "@/features/bookings/components/BookingRequestDrawer";
import { useBookingRequestsQuery } from "@/features/bookings/hooks/useBookingRequests";
import { useAvailabilityWindowsQuery } from "@/features/bookings/hooks/useAvailability";
import { useOutOfOfficeBlocksQuery } from "@/features/bookings/hooks/useOutOfOffice";
import { usePendingCount } from "@/features/bookings/hooks/usePendingCount";
import type { CalendarView, EventWithClient } from "@/features/events/types";
import type { BookingRequestWithClient } from "@/features/bookings/types";

const Calendar = () => {
  const [sp, setSp] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(() => {
    const dateParam = sp.get("date");
    return dateParam ? parseISO(dateParam) : new Date();
  });
  const [view, setView] = useState<CalendarView>((sp.get("view") as CalendarView) || "week");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithClient | undefined>();
  const [selectedRequest, setSelectedRequest] = useState<BookingRequestWithClient | undefined>();
  const [prefillData, setPrefillData] = useState<any>();
  const [layers, setLayers] = useState<CalendarLayers>({
    approved: true,
    pending: true,
    ooo: false,
    availability: false,
  });

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch booking data
  const { data: bookingRequests = [] } = useBookingRequestsQuery({ status: "PENDING" });
  const { data: availabilityWindows = [] } = useAvailabilityWindowsQuery();
  const { data: oooBlocks = [] } = useOutOfOfficeBlocksQuery();
  const { data: pendingCount = 0 } = usePendingCount();

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
    setSelectedRequest(undefined);
    setPrefillData(undefined);
    setModalOpen(true);
  };

  const handleRequestClick = (request: BookingRequestWithClient) => {
    setSelectedRequest(request);
    setSelectedEvent(undefined);
    setPrefillData(undefined);
    setDrawerOpen(true);
  };

  const handleNewEvent = () => {
    setSelectedEvent(undefined);
    setSelectedRequest(undefined);
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

  const toggleLayer = (layer: keyof CalendarLayers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background w-full">
      <PageHeader
        title="Calendario"
        subtitle="Organizza appuntamenti e sessioni con i tuoi clienti"
        primaryCta={{
          label: "Nuovo appuntamento",
          onClick: handleNewEvent,
          icon: <Plus className="h-4 w-4" />,
          testId: "calendar-new-event-btn"
        }}
        toolbarLeft={
          <div className="flex items-center gap-4 w-full">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca appuntamenti..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <CalendarLayerFilters
              layers={layers}
              onToggle={toggleLayer}
              pendingCount={pendingCount}
            />
          </div>
        }
      />

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
      <div className="flex-1 overflow-auto mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10">
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
                events={layers.approved ? filteredEvents : []}
                bookingRequests={layers.pending ? bookingRequests : []}
                availabilityWindows={layers.availability ? availabilityWindows : []}
                oooBlocks={layers.ooo ? oooBlocks : []}
                onEventClick={handleEventClick}
                onRequestClick={handleRequestClick}
              />
            )}
            {view === "week" && (
              <WeekView
                date={currentDate}
                events={layers.approved ? filteredEvents : []}
                bookingRequests={layers.pending ? bookingRequests : []}
                availabilityWindows={layers.availability ? availabilityWindows : []}
                oooBlocks={layers.ooo ? oooBlocks : []}
                onEventClick={handleEventClick}
                onRequestClick={handleRequestClick}
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

      {/* Booking Request Drawer */}
      <BookingRequestDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        request={selectedRequest}
      />
    </div>
  );
};

export default Calendar;
