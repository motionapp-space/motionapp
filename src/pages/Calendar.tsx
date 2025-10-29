import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { parseISO, format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Search, Calendar as CalendarIcon, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { useEventsQuery } from "@/features/events/hooks/useEventsQuery";
import { CalendarToolbar } from "@/features/events/components/CalendarToolbar";
import { DayView } from "@/features/events/components/DayView";
import { WeekView } from "@/features/events/components/WeekView";
import { MonthView } from "@/features/events/components/MonthView";
import { YearView } from "@/features/events/components/YearView";
import { BookingRequestDrawer } from "@/features/bookings/components/BookingRequestDrawer";
import { useDebounce } from "@/hooks/use-debounce";
import { useBookingRequestsQuery } from "@/features/bookings/hooks/useBookingRequests";
import { useAvailabilityWindowsQuery } from "@/features/bookings/hooks/useAvailability";
import { useOutOfOfficeBlocksQuery } from "@/features/bookings/hooks/useOutOfOffice";
import { usePendingCount } from "@/features/bookings/hooks/usePendingCount";
import type { CalendarView, EventWithClient } from "@/features/events/types";
import type { BookingRequestWithClient } from "@/features/bookings/types";
import { EventModal } from "@/features/events/components/EventModal";

type FilterOption = "all" | "approved" | "pending" | "ooo" | "availability";

const Calendar = () => {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(() => {
    const dateParam = sp.get("date");
    return dateParam ? parseISO(dateParam) : new Date();
  });
  const [view, setView] = useState<CalendarView>((sp.get("view") as CalendarView) || "week");
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithClient | undefined>();
  const [selectedRequest, setSelectedRequest] = useState<BookingRequestWithClient | undefined>();
  const [filterOption, setFilterOption] = useState<FilterOption>("all");

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
    setEditModalOpen(true);
  };

  const handleRequestClick = (request: BookingRequestWithClient) => {
    setSelectedRequest(request);
    setRequestDrawerOpen(true);
  };

  const handleNewEvent = () => {
    setCreateModalOpen(true);
  };

  const handleMonthClick = (month: Date) => {
    setView("month");
    setCurrentDate(month);
    sp.set("view", "month");
    sp.set("date", format(month, "yyyy-MM-dd"));
    setSp(sp);
  };

  // Determine which layers to show based on filter
  const showApproved = filterOption === "all" || filterOption === "approved";
  const showPending = filterOption === "all" || filterOption === "pending";
  const showOoo = filterOption === "all" || filterOption === "ooo";
  const showAvailability = filterOption === "all" || filterOption === "availability";

  return (
    <div className="min-h-screen flex flex-col bg-background w-full">
      <PageHeader
        title="Appuntamenti"
        subtitle="Organizza e gestisci le tue sessioni con i clienti"
        primaryCta={{
          label: "Nuovo appuntamento",
          onClick: handleNewEvent,
          icon: <Plus className="h-4 w-4" />,
          testId: "calendar-new-event-btn"
        }}
        toolbarLeft={
          <div className="flex items-center gap-3 w-full">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per cliente o tipo di sessione..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <Select value={filterOption} onValueChange={(v) => setFilterOption(v as FilterOption)}>
              <SelectTrigger className="w-[160px] h-10">
                <SelectValue placeholder="Mostra" />
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
        }
        toolbarRight={
          <Button
            variant="outline"
            onClick={() => navigate("/calendar/manage")}
            className="gap-2 h-10 relative"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Gestione prenotazioni</span>
            <span className="sm:hidden">Gestione</span>
            {pendingCount > 0 && (
              <Badge 
                variant={pendingCount >= 10 ? "destructive" : "default"}
                className={`h-5 min-w-5 px-1.5 ${pendingCount >= 10 ? 'animate-pulse' : ''}`}
              >
                {pendingCount}
              </Badge>
            )}
          </Button>
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
                events={showApproved ? filteredEvents : []}
                bookingRequests={showPending ? bookingRequests : []}
                availabilityWindows={showAvailability ? availabilityWindows : []}
                oooBlocks={showOoo ? oooBlocks : []}
                onEventClick={handleEventClick}
                onRequestClick={handleRequestClick}
              />
            )}
            {view === "week" && (
              <WeekView
                date={currentDate}
                events={showApproved ? filteredEvents : []}
                bookingRequests={showPending ? bookingRequests : []}
                availabilityWindows={showAvailability ? availabilityWindows : []}
                oooBlocks={showOoo ? oooBlocks : []}
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

      {/* Create Appointment Modal */}
      <EventModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        prefillData={{
          start: new Date(currentDate.setHours(9, 0)),
          end: new Date(currentDate.setHours(10, 0)),
        }}
      />

      {/* Edit Event Modal */}
      <EventModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        event={selectedEvent}
      />


      {/* Booking Request Drawer */}
      <BookingRequestDrawer
        open={requestDrawerOpen}
        onOpenChange={setRequestDrawerOpen}
        request={selectedRequest}
      />
    </div>
  );
};

export default Calendar;
