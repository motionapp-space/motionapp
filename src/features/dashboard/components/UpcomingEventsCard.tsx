import { Link, useNavigate } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import { format, isToday, isTomorrow, startOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useUpcomingEvents } from "../hooks/useUpcomingEvents";

function getRelativeDay(date: Date): string {
  if (isToday(date)) return "Oggi";
  if (isTomorrow(date)) return "Domani";
  return format(date, "EEE d", { locale: it }).replace(/^\w/, (c) => c.toUpperCase());
}

export default function UpcomingEventsCard() {
  const { data, isLoading } = useUpcomingEvents();
  const navigate = useNavigate();

  // Filter out today's events — those belong to TodayEventsCard
  const futureEvents = (data?.events ?? []).filter(
    (e) => !isToday(new Date(e.start_at))
  );
  const visibleEvents = futureEvents.slice(0, 5);
  const hasEvents = visibleEvents.length > 0;

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3 h-full">
        <Skeleton className="h-5 w-36" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col h-full">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Prossimi eventi
      </h2>

      {hasEvents ? (
        <div className="flex flex-col gap-1">
          {visibleEvents.map((event) => {
            const date = new Date(event.start_at);
            const dayLabel = getRelativeDay(date);
            const time = format(date, "HH:mm");

            return (
              <button
                key={event.id}
                onClick={() => navigate("/calendar")}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm hover:bg-accent/10 hover:-translate-y-[1px] transition-all duration-200"
              >
                <span className="text-muted-foreground tabular-nums shrink-0 w-[120px] whitespace-nowrap">
                  {dayLabel} · {time}
                </span>
                <span className="text-foreground font-medium truncate">
                  {event.client_name}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center py-6 space-y-1.5">
          <Calendar className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-foreground">
            Nessun evento in programma
          </p>
          <p className="text-xs text-muted-foreground">
            I prossimi appuntamenti appariranno qui
          </p>
          <Button size="sm" variant="outline" asChild className="mt-1">
            <Link to="/calendar">
              <Calendar className="h-4 w-4 mr-1.5" />
              Vai al calendario
            </Link>
          </Button>
        </div>
      )}

      <div className="mt-auto pt-4">
        <Link
          to="/calendar"
          className="text-sm text-accent-strong font-medium hover:text-accent-hover transition-colors duration-200 inline-flex items-center gap-1"
        >
          Vai al calendario
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
