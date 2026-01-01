import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { parseISO, format } from "date-fns";
import { useTopbar } from "@/contexts/TopbarContext";
import { Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useEventsQuery } from "@/features/events/hooks/useEventsQuery";
import { CalendarSubHeader } from "@/features/events/components/CalendarSubHeader";
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
import { useBookingSettingsQuery } from "@/features/bookings/hooks/useBookingSettings";
import type { CalendarView as CalendarViewType, EventWithClient, CalendarViewMode } from "@/features/events/types";
import type { BookingRequestWithClient } from "@/features/bookings/types";
import { EventModal } from "@/features/events/components/EventModal";
import { DayPicker } from "@/features/sessions/components/DayPicker";
import { useCreateSession } from "@/features/sessions/hooks/useCreateSession";
import { ClientViewBanner } from "@/features/events/components/ClientViewBanner";
import { getCoachClientId } from "@/lib/coach-client";
import { PREVIEW_MESSAGES } from "@/features/events/utils/preview-messages";

type FilterOption = "all" | "approved" | "pending" | "ooo" | "availability";

const Calendar = () => {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(() => {
    const dateParam = sp.get("date");
    return dateParam ? parseISO(dateParam) : new Date();
  });
  const [view, setView] = useState<CalendarViewType>((sp.get("view") as CalendarViewType) || "week");
  const [searchQuery, setSearchQuery] = useState("");
  
  useTopbar({ title: "Agenda" });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithClient | undefined>();
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [sessionEventData, setSessionEventData] = useState<{ clientId: string; eventId: string; linkedPlanId?: string; linkedDayId?: string } | null>(null);
  
  const createSession = useCreateSession();
  const [selectedRequest, setSelectedRequest] = useState<BookingRequestWithClient | undefined>();
  const [filterOption, setFilterOption] = useState<FilterOption>("all");

  const [isClientView, setIsClientView] = useState<boolean>(() => {
    return localStorage.getItem('calendar-client-view') === 'true';
  });

  const { data: bookingSettings } = useBookingSettingsQuery();
  const hasSelfServiceBooking = bookingSettings?.enabled === true;
  const { data: pendingCount = 0 } = usePendingCount();
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    localStorage.setItem('calendar-client-view', String(isClientView));
  }, [isClientView]);

  useEffect(() => {
    if (!hasSelfServiceBooking && isClientView) {
      setIsClientView(false);
    }
  }, [hasSelfServiceBooking, isClientView]);

  const { data: bookingRequests = [] } = useBookingRequestsQuery({ status: "PENDING" });
  const { data: availabilityWindows = [] } = useAvailabilityWindowsQuery();
  const { data: oooBlocks = [] } = useOutOfOfficeBlocksQuery();

  const viewMode: CalendarViewMode = isClientView ? 'client-preview' : 'coach';
  const isPreviewMode = isClientView;

  const handleViewChange = (newView: CalendarViewType) => {
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

  const { data: events = [], isLoading } = useEventsQuery({
    q: debouncedSearch,
  });

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

  const handleStartSession = (clientId: string, eventId: string, linkedPlanId?: string, linkedDayId?: string) => {
    setSessionEventData({ clientId, eventId, linkedPlanId, linkedDayId });
    setDayPickerOpen(true);
  };

  const handleDayPickerConfirm = async (planId: string, dayId: string) => {
    if (!sessionEventData) return;
    
    const coachClientId = await getCoachClientId(sessionEventData.clientId);
    const session = await createSession.mutateAsync({
      coach_client_id: coachClientId,
      plan_id: planId,
      day_id: dayId,
      event_id: sessionEventData.eventId,
    });
    
    navigate(`/session/live?sessionId=${session.id}`);
  };

  const handleRequestClick = (request: BookingRequestWithClient) => {
    setSelectedRequest(request);
    setRequestDrawerOpen(true);
  };

  const handleToggleClientView = () => {
    if (!hasSelfServiceBooking) return;
    setIsClientView(prev => !prev);
  };

  const handleBackToCoach = () => {
    setIsClientView(false);
  };

  const handleEditModalOpenChange = (open: boolean) => {
    setEditModalOpen(open);
    if (!open) {
      setSelectedEvent(undefined);
    }
  };

  const handleNewEvent = () => {
    if (viewMode !== 'coach') {
      toast.error(PREVIEW_MESSAGES.BLOCKED_ACTION);
      return;
    }
    setCreateModalOpen(true);
  };

  const handleMonthClick = (month: Date) => {
    setView("month");
    setCurrentDate(month);
    sp.set("view", "month");
    sp.set("date", format(month, "yyyy-MM-dd"));
    setSp(sp);
  };

  const showApproved = filterOption === "all" || filterOption === "approved";
  const showPending = filterOption === "all" || filterOption === "pending";
  const showOoo = filterOption === "all" || filterOption === "ooo";
  const showAvailability = filterOption === "all" || filterOption === "availability";

  const calendarMode = viewMode === 'coach' ? 'coach' : 'client';

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-background w-full overflow-hidden">
      {/* SubHeader: STICKY top-16, h-12 (48px), z-40 */}
      <CalendarSubHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterOption={filterOption}
        onFilterChange={setFilterOption}
        pendingCount={pendingCount}
        onManageBookings={() => navigate("/calendar/manage")}
        onNewEvent={handleNewEvent}
        view={view}
        currentDate={currentDate}
        onViewChange={handleViewChange}
        onDateChange={handleDateChange}
        onToday={handleToday}
        showClientViewToggle={hasSelfServiceBooking}
        isClientView={isClientView}
        onToggleClientView={handleToggleClientView}
      />

      {/* Client View Banner - only shows when in client view */}
      {isClientView && (
        <div className="shrink-0 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10 py-2">
          <ClientViewBanner onBackToCoach={handleBackToCoach} />
        </div>
      )}

      {/* Calendar Views Container - flex-1 takes remaining space */}
      <div className="flex-1 overflow-hidden mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : filteredEvents.length === 0 && searchQuery ? (
          <div className="flex h-full items-center justify-center text-center py-16">
            <div>
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nessun evento trovato</p>
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
                mode={calendarMode}
                isPreviewMode={isPreviewMode}
                onGridClick={(date, startTime) => {
                  if (isPreviewMode) {
                    toast.info(PREVIEW_MESSAGES.BLOCKED_ACTION);
                    return;
                  }
                  setCreateModalOpen(true);
                }}
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
                mode={calendarMode}
                isPreviewMode={isPreviewMode}
                onGridClick={(date, startTime) => {
                  if (isPreviewMode) {
                    toast.info(PREVIEW_MESSAGES.BLOCKED_ACTION);
                    return;
                  }
                  setCreateModalOpen(true);
                }}
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

      {/* Modals */}
      <EventModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        mode="coach-create"
      />

      {selectedEvent && (
        <EventModal
          open={editModalOpen}
          onOpenChange={handleEditModalOpenChange}
          mode="coach-create"
          event={selectedEvent}
          onStartSession={handleStartSession}
        />
      )}

      <BookingRequestDrawer
        open={requestDrawerOpen}
        onOpenChange={setRequestDrawerOpen}
        request={selectedRequest}
      />

      {sessionEventData && (
        <DayPicker
          open={dayPickerOpen}
          onOpenChange={setDayPickerOpen}
          clientId={sessionEventData.clientId}
          linkedPlanId={sessionEventData.linkedPlanId}
          linkedDayId={sessionEventData.linkedDayId}
          onConfirm={handleDayPickerConfirm}
        />
      )}
    </div>
  );
};

export default Calendar;