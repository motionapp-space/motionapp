import { useState } from "react";
import { useClientEvents } from "@/features/events/hooks/useClientEvents";
import { EventModal } from "@/features/events/components/EventModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar, MapPin, Clock } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { TabHeader } from "@/components/ui/tab-header";
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

  const handleModalOpenChange = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setSelectedEvent(undefined);
    }
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
      {/* Header - CTA sempre visibile */}
      <TabHeader
        title="Appuntamenti"
        subtitle="Eventi a calendario tra te e il cliente, passati e futuri"
        action={
          <Button onClick={handleNewEvent} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nuovo appuntamento
          </Button>
        }
      />

      {/* Microcopy educativo - solo quando ci sono eventi */}
      {(upcomingEvents.length > 0 || pastEvents.length > 0) && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          Un appuntamento rappresenta un incontro. Se durante l'incontro si svolge un allenamento, puoi registrare una sessione di allenamento.
        </p>
      )}

      {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Calendar}
              title="Nessun appuntamento"
              description="Crea un appuntamento per pianificare un incontro con il cliente, anche se non è previsto un allenamento."
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
              <h4 className="text-sm font-medium text-muted-foreground">Prossimi ({upcomingEvents.length})</h4>
              {upcomingEvents.map((event) => (
                <Card
                  key={event.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(event);
                  }}
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
              <h4 className="text-sm font-medium text-muted-foreground">Passati ({pastEvents.length})</h4>
              {pastEvents.map((event) => (
                <Card
                  key={event.id}
                  className="cursor-pointer hover:shadow-md transition-shadow opacity-75"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(event);
                  }}
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

      {/* Create Modal - solo quando non c'è selectedEvent */}
      {modalOpen && !selectedEvent && (
        <EventModal
          open={modalOpen}
          onOpenChange={handleModalOpenChange}
          prefillData={{ clientId }}
          lockedClientId={clientId}
          mode="coach-create"
        />
      )}

      {/* Edit Modal - solo quando c'è selectedEvent */}
      {selectedEvent && (
        <EventModal
          open={modalOpen}
          onOpenChange={handleModalOpenChange}
          event={selectedEvent}
          lockedClientId={clientId}
          mode="coach-create"
        />
      )}
    </div>
  );
}
