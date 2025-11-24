import { useState } from "react";
import { useClientEvents } from "@/features/events/hooks/useClientEvents";
import { EventModal } from "@/features/events/components/EventModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar, MapPin, Clock } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { format, parseISO, addHours } from "date-fns";
import { it } from "date-fns/locale";
import { formatTimeRange, isEventInPast } from "@/features/events/utils/calendar-utils";
import { cn } from "@/lib/utils";
import type { EventWithClient } from "@/features/events/types";

interface ClientAppointmentsTabProps {
  clientId: string;
}

export function ClientAppointmentsTab({ clientId }: ClientAppointmentsTabProps) {
  const { data: events = [], isLoading } = useClientEvents(clientId);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithClient | undefined>();

  const now = new Date();
  const upcomingEvents = events.filter(e => parseISO(e.start_at) >= now);
  const pastEvents = events.filter(e => parseISO(e.start_at) < now);

  const handleNewEvent = () => {
    setSelectedEvent(undefined);
    setModalOpen(true);
  };

  const handleEventClick = (event: EventWithClient) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Appuntamenti</h3>
        {(upcomingEvents.length > 0 || pastEvents.length > 0) && (
          <Button onClick={handleNewEvent} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nuovo appuntamento
          </Button>
        )}
      </div>

      {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Calendar}
              title="Nessun appuntamento"
              description="Non ci sono appuntamenti programmati per questo cliente. Crea il primo appuntamento per iniziare."
              action={{
                label: "Crea primo appuntamento",
                onClick: handleNewEvent
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {upcomingEvents.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Prossimi</h4>
              {upcomingEvents.map((event) => (
                <Card
                  key={event.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleEventClick(event)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-base mb-1 truncate">{event.title}</h4>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">
                              {format(parseISO(event.start_at), "EEEE, d MMMM yyyy", { locale: it })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{formatTimeRange(event.start_at, event.end_at, event.is_all_day)}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {pastEvents.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Passati</h4>
              {pastEvents.map((event) => (
                <Card
                  key={event.id}
                  className="cursor-pointer hover:shadow-md transition-shadow opacity-75"
                  onClick={() => handleEventClick(event)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-base mb-1 truncate">{event.title}</h4>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">
                              {format(parseISO(event.start_at), "EEEE, d MMMM yyyy", { locale: it })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{formatTimeRange(event.start_at, event.end_at, event.is_all_day)}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <EventModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        event={selectedEvent}
        prefillData={
          !selectedEvent
            ? {
                start: new Date(),
                end: addHours(new Date(), 1),
                clientId,
              }
            : undefined
        }
        lockedClientId={clientId}
        mode="coach-create"
      />
    </div>
  );
}
