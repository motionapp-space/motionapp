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
        "flex items-center gap-4 px-4 min-h-[56px] w-full text-left rounded-lg transition-colors duration-200",
        event.isNext
          ? "bg-accent/10 hover:bg-accent/15"
          : "hover:bg-muted/50"
      )}
    >
      <span className="text-sm tabular-nums text-muted-foreground w-[52px] shrink-0">
        {format(new Date(event.start_at), "HH:mm")}
      </span>
      <span className="text-sm font-medium text-foreground truncate">
        {event.client_name}
      </span>
      <span className="text-sm text-muted-foreground truncate ml-auto">
        {event.title}
      </span>
    </button>
  );
}

function NextEventBanner({ event }: { event: TodayEvent }) {
  return (
    <div className="px-4 py-2 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">Prossimo evento</span>
      {" — "}
      {format(new Date(event.start_at), "HH:mm")} — {event.client_name}
    </div>
  );
}

export default function TodayEventsCard() {
  const { data: events, isLoading } = useTodayEvents();
  const nextEvent = events?.find((e) => e.isNext);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 space-y-3">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
      <h2 className="text-[17px] font-semibold text-foreground mb-4">
        Eventi di oggi
      </h2>

      {nextEvent && <NextEventBanner event={nextEvent} />}

      {events && events.length > 0 ? (
        <div className="flex flex-col gap-0.5">
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="py-6 space-y-2">
          <Calendar className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-base font-semibold text-foreground">
            Nessun evento in programma oggi
          </p>
          <p className="text-sm text-muted-foreground">
            Goditi il tempo libero o pianifica qualcosa di nuovo
          </p>
          <Button size="sm" variant="outline" asChild className="mt-2">
            <Link to="/calendar">Crea evento</Link>
          </Button>
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-border">
        <Link
          to="/calendar"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 inline-flex items-center gap-1"
        >
          Vedi calendario completo
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
