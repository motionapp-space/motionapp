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
        "flex flex-col gap-0.5 px-4 py-3 w-full text-left rounded-xl cursor-pointer transition-all duration-200 hover:translate-y-[-1px]",
        event.isNext
          ? "bg-accent/20 ring-1 ring-accent/30 hover:bg-accent/25"
          : "bg-white/5 hover:bg-white/10"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm tabular-nums text-white/70 w-[52px] shrink-0">
          {format(new Date(event.start_at), "HH:mm")}
        </span>
        <span className="text-sm font-medium text-white truncate">
          {event.client_name}
        </span>
      </div>
      <span className="text-xs text-white/60 truncate pl-[64px]">
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
          ? "bg-gradient-to-b from-neutral-950 to-neutral-900 border border-transparent text-primary-foreground"
          : "bg-card border border-border"
      )}
    >
      <h2
        className={cn(
          "text-xl font-semibold",
          hasEvents
            ? "text-primary-foreground mb-3 pb-3 border-b border-white/[0.08]"
            : "text-foreground mb-4"
        )}
      >
        Eventi di oggi{hasEvents ? ` · ${events.length}` : ""}
      </h2>

      {hasEvents ? (
        <div className="flex flex-col gap-2">
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center py-3 space-y-1.5">
          <Calendar className="h-8 w-8 text-muted-foreground/60" />
          <p className="text-base font-semibold text-foreground">
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

      <div
        className={cn(
          "mt-auto pt-4 border-t",
          hasEvents ? "border-primary-foreground/10" : "border-border"
        )}
      >
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
