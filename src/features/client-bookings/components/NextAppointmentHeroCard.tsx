import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, CalendarX } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientAppointmentView } from "../types";

interface NextAppointmentHeroCardProps {
  appointment: ClientAppointmentView | null;
  isLoading?: boolean;
  onClick: () => void;
}

export function NextAppointmentHeroCard({ 
  appointment, 
  isLoading,
  onClick 
}: NextAppointmentHeroCardProps) {
  if (isLoading) {
    return <Skeleton className="h-24 w-full rounded-xl" />;
  }

  // Empty state - no upcoming appointment
  if (!appointment) {
    return (
      <Card className="shadow-sm border-dashed">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <CalendarX className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Nessun appuntamento confermato</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Prenota il tuo prossimo appuntamento
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const startDate = new Date(appointment.startAt);
  const endDate = new Date(appointment.endAt);
  const day = format(startDate, "d");
  const month = format(startDate, "MMM", { locale: it }).toUpperCase();
  const formattedTime = `${format(startDate, "HH:mm")} – ${format(endDate, "HH:mm")}`;

  return (
    <Card 
      className="shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex">
          {/* Left column: Date display */}
          <div className="flex flex-col items-center justify-center px-5 py-5 bg-primary/5 min-w-[80px]">
            <span className="text-3xl font-bold text-primary leading-none">{day}</span>
            <span className="text-xs text-muted-foreground uppercase mt-1 tracking-wide">{month}</span>
          </div>
          
          {/* Right column: Details */}
          <div className="flex-1 p-4 flex items-center justify-between min-w-0">
            <div className="min-w-0">
              <p className="font-medium text-foreground">{formattedTime}</p>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {appointment.title}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
