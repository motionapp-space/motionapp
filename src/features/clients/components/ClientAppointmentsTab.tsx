import { useState } from "react";
import { useClientEvents } from "@/features/events/hooks/useClientEvents";
import { EventModal } from "@/features/events/components/EventModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar, MapPin, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { formatTimeRange } from "@/features/events/utils/calendar-utils";
import { cn } from "@/lib/utils";
import type { EventWithClient } from "@/features/events/types";

interface ClientAppointmentsTabProps {
  clientId: string;
}

function AppointmentCard({ 
  event, 
  onClick, 
  isPast = false 
}: { 
  event: EventWithClient; 
  onClick: () => void; 
  isPast?: boolean;
}) {
  const startDate = parseISO(event.start_at);
  const dayNumber = format(startDate, "d");
  const monthAbbr = format(startDate, "MMM", { locale: it }).toUpperCase();
  const timeRange = formatTimeRange(event.start_at, event.end_at, event.is_all_day);

  return (
    <Card
      className={cn(
        "cursor-pointer border border-border/60 transition-all group",
        "hover:bg-muted/20 hover:border-border hover:shadow-sm",
        isPast && "opacity-70"
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex items-stretch">
          {/* Colonna sinistra: data */}
          <div className="flex flex-col items-center justify-center w-16 shrink-0 py-3 bg-muted/30 rounded-l-lg">
            <span className="text-xl font-semibold text-primary leading-none">
              {dayNumber}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase mt-0.5">
              {monthAbbr}
            </span>
          </div>
          
          {/* Contenuto principale */}
          <div className="flex-1 min-w-0 py-3 px-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm leading-tight">
                {timeRange}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {event.title}
              </p>
              {event.location && (
                <p className="text-xs text-muted-foreground/80 mt-1 truncate flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {event.location}
                </p>
              )}
            </div>
            
            {/* Chevron - visibile su hover (desktop), sempre visibile (mobile) */}
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
              <h4 className="text-xs font-medium tracking-widest text-muted-foreground/70 uppercase">
                Prossimi ({upcomingEvents.length})
              </h4>
              {upcomingEvents.map((event) => (
                <AppointmentCard
                  key={event.id}
                  event={event}
                  onClick={() => handleEventClick(event)}
                />
              ))}
            </div>
          )}

          {pastEvents.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium tracking-widest text-muted-foreground/70 uppercase">
                Passati ({pastEvents.length})
              </h4>
              {pastEvents.map((event) => (
                <AppointmentCard
                  key={event.id}
                  event={event}
                  onClick={() => handleEventClick(event)}
                  isPast
                />
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
