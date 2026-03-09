import { Link, useNavigate } from "react-router-dom";
import { Calendar, ArrowRight, CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTodayEvents, type TodayEvent } from "../hooks/useTodayEvents";
import { cn } from "@/lib/utils";

function EventRow({ event }: { event: TodayEvent }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/calendar")}
      className={cn(
        "flex flex-col gap-0.5 px-3 py-2.5 w-full text-left rounded-lg cursor-pointer transition-all duration-200 hover:-translate-y-[1px]",
        "flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-lg cursor-pointer transition-all duration-200 hover:-translate-y-[1px]",
        event.isNext
          ? "bg-accent/15 ring-1 ring-accent/30 hover:bg-accent/20"
          : "bg-accent/8 hover:bg-accent/12"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm tabular-nums text-muted-foreground w-[52px] shrink-0">
          {format(new Date(event.start_at), "HH:mm")}
        </span>
        <span className="text-sm font-medium text-foreground truncate">
          {event.client_name}
        </span>
      </div>
      <span className="text-xs text-muted-foreground truncate pl-[64px]">
        {event.title}
      </span>
    </button>
  );
}

export default function TodayEventsCard() {
  const { data: events, isLoading } = useTodayEvents();
  const hasEvents = events && events.length > 0;

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3 h-full">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl p-6 flex flex-col h-full",
        hasEvents
          ? "bg-accent/4 border border-accent/12"
          : "bg-card border border-border"
      )}
    >
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Eventi di oggi{hasEvents ? ` · ${events.length}` : ""}
      </h2>

      {hasEvents ? (
        <div className="flex flex-col gap-2">
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center py-6 space-y-1.5">
          <Calendar className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-foreground">
            Nessun evento in programma oggi
          </p>
          <p className="text-xs text-muted-foreground">
            Goditi il tempo libero o pianifica qualcosa di nuovo
          </p>
          <Button size="sm" variant="outline" asChild className="mt-1">
            <Link to="/calendar">
              <CalendarPlus className="h-4 w-4 mr-1.5" />
              Crea evento
            </Link>
          </Button>
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-border">
        <Link
          to="/calendar"
          className="text-sm text-accent font-medium hover:text-accent-hover transition-colors duration-200 inline-flex items-center gap-1"
        >
          Vedi calendario completo
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
