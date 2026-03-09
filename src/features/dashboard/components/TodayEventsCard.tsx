import { Link, useNavigate } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
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
        "flex items-center gap-4 px-4 py-3 w-full text-left rounded-xl cursor-pointer transition-all duration-200 hover:translate-y-[-1px]",
        event.isNext
          ? "bg-accent/20 ring-1 ring-accent/30 hover:bg-accent/25"
          : "bg-white/5 hover:bg-white/10"
      )}
    >
      <span className="text-sm tabular-nums text-primary-foreground/60 w-[52px] shrink-0">
        {format(new Date(event.start_at), "HH:mm")}
      </span>
      <span className="text-sm font-medium text-primary-foreground truncate">
        {event.client_name}
      </span>
      <span className="text-sm text-primary-foreground/50 truncate ml-auto">
        {event.title}
      </span>
    </button>
  );
}

function NextEventBanner({ event }: { event: TodayEvent }) {
  return (
    <div className="px-4 py-2 space-y-0.5">
      <p className="text-xs font-medium text-accent">Prossimo evento</p>
      <p className="text-sm text-primary-foreground/70">
        {format(new Date(event.start_at), "HH:mm")} — {event.client_name}
      </p>
    </div>
  );
}

export default function TodayEventsCard() {
  const { data: events, isLoading } = useTodayEvents();
  const nextEvent = events?.find((e) => e.isNext);
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
        Eventi di oggi
      </h2>

      {nextEvent && <NextEventBanner event={nextEvent} />}

      {hasEvents ? (
        <div className="flex flex-col gap-2">
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="py-3 space-y-1.5">
          <Calendar className="h-8 w-8 text-muted-foreground/60" />
          <p className="text-base font-semibold text-foreground">
            Nessun evento in programma oggi
          </p>
          <p className="text-xs text-muted-foreground">
            Goditi il tempo libero o pianifica qualcosa di nuovo
          </p>
          <Button size="sm" variant="outline" asChild className="mt-1">
            <Link to="/calendar">Crea evento</Link>
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
