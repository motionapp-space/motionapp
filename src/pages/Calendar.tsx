import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSearchParams, useNavigate } from "react-router-dom";
import { parseISO, format } from "date-fns";
import { useTopbar } from "@/contexts/TopbarContext";
import { Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useDeleteEvent } from "@/features/events/hooks/useDeleteEvent";
import { useDeleteSeries } from "@/features/events/hooks/useDeleteSeries";
import { useQuery } from "@tanstack/react-query";
import { countFutureSeriesEvents } from "@/features/events/api/events.api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
import { ClientViewBanner } from "@/features/events/components/ClientViewBanner";
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
  const [selectedEvent, setSelectedEvent] = useState<EventWithClient | undefined>();
  const [prefillEventData, setPrefillEventData] = useState<{ start: Date; end: Date } | undefined>();
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BookingRequestWithClient | undefined>();
  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    eventId: string;
    eventTitle: string;
    seriesId?: string | null;
  } | null>(null);
  const [deleteScope, setDeleteScope] = useState<'single' | 'series'>('single');

  const deleteEvent = useDeleteEvent();
  const deleteSeries = useDeleteSeries();
  
  // Query per contare eventi futuri della serie (solo se c'è series_id)
  const { data: futureSeriesCount = 0, isLoading: isLoadingSeriesCount } = useQuery({
    queryKey: ['series-count', deleteConfirmation?.seriesId],
    queryFn: () => countFutureSeriesEvents(deleteConfirmation!.seriesId!),
    enabled: !!deleteConfirmation?.seriesId,
    staleTime: 0, // Sempre fresh quando apriamo la modale
  });

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

  const handleDeleteRequest = (
    eventId: string, 
    eventTitle: string, 
    seriesId?: string | null
  ) => {
    setDeleteConfirmation({ eventId, eventTitle, seriesId });
    setDeleteScope('single'); // Reset a default sicuro
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation) return;
    
    try {
      if (deleteScope === 'series' && deleteConfirmation.seriesId) {
        await deleteSeries.mutateAsync(deleteConfirmation.seriesId);
      } else {
        await deleteEvent.mutateAsync(deleteConfirmation.eventId);
      }
    } finally {
      setDeleteConfirmation(null);
      setDeleteScope('single');
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
    // AgendaViewport: h-[calc(100vh-64px)] to account for topbar, NO scroll here
    <div className="h-full flex flex-col bg-background w-full overflow-hidden pt-2 md:pt-3">
      {/* SubHeader: FIRST child, sticky top-0 relative to this container, h-12 (48px), z-40 */}
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

      {/* Calendar Views Container - takes remaining height, conditional overflow for year view */}
      <div className={cn(
        "flex-1 min-h-0 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10",
        view === "year" ? "overflow-y-auto overflow-x-hidden overscroll-contain" : "overflow-hidden"
      )}>
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
                  const slotDuration = bookingSettings?.slot_duration_minutes || 45;
                  const endTime = new Date(startTime.getTime() + slotDuration * 60 * 1000);
                  setPrefillEventData({ start: startTime, end: endTime });
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
                  const slotDuration = bookingSettings?.slot_duration_minutes || 45;
                  const endTime = new Date(startTime.getTime() + slotDuration * 60 * 1000);
                  setPrefillEventData({ start: startTime, end: endTime });
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
        onOpenChange={(open) => {
          setCreateModalOpen(open);
          if (!open) setPrefillEventData(undefined);
        }}
        mode="coach-create"
        prefillData={prefillEventData}
      />

      {selectedEvent && (
        <EventModal
          open={editModalOpen}
          onOpenChange={handleEditModalOpenChange}
          mode="coach-create"
          event={selectedEvent}
          onDeleteRequest={(eventId, eventTitle, seriesId) => 
            handleDeleteRequest(eventId, eventTitle, seriesId)
          }
        />
      )}

      <BookingRequestDrawer
        open={requestDrawerOpen}
        onOpenChange={setRequestDrawerOpen}
        request={selectedRequest}
      />

      {/* Delete Confirmation Dialog - managed at Calendar level to avoid modal-on-modal */}
      <AlertDialog 
        open={!!deleteConfirmation} 
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirmation(null);
            setDeleteScope('single');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancellare questo appuntamento?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Stai per eliminare l'evento "{deleteConfirmation?.eventTitle}".
                </p>
                
                {/* Scelta serie/singolo - solo se fa parte di una serie con più eventi futuri */}
                {deleteConfirmation?.seriesId && !isLoadingSeriesCount && futureSeriesCount > 1 && (
                  <RadioGroup
                    value={deleteScope}
                    onValueChange={(v) => setDeleteScope(v as 'single' | 'series')}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="single" id="delete-single" />
                      <Label htmlFor="delete-single" className="font-normal cursor-pointer">
                        Solo questo evento
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="series" id="delete-series" />
                      <Label htmlFor="delete-series" className="font-normal cursor-pointer">
                        Tutti i {futureSeriesCount} appuntamenti futuri della serie
                      </Label>
                    </div>
                  </RadioGroup>
                )}
                
                {/* Loading state per il conteggio */}
                {deleteConfirmation?.seriesId && isLoadingSeriesCount && (
                  <p className="text-sm text-muted-foreground italic">
                    Verifica appuntamenti della serie...
                  </p>
                )}
                
                {/* Avviso notifiche - SEMPRE visibile */}
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <span className="text-amber-800 dark:text-amber-200">
                    Il cliente riceverà una notifica in-app e via email.
                  </span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={deleteEvent.isPending || deleteSeries.isPending || isLoadingSeriesCount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {(deleteEvent.isPending || deleteSeries.isPending) 
                ? "Eliminazione..." 
                : deleteScope === 'series' 
                  ? `Elimina ${futureSeriesCount} eventi`
                  : "Elimina"
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Calendar;