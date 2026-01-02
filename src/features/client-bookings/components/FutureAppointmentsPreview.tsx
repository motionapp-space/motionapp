import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientAppointmentView } from "../types";

interface FutureAppointmentsPreviewProps {
  appointments: ClientAppointmentView[];
  hasMore: boolean;
  hasNextAppointment: boolean;
  onAppointmentClick: (appointment: ClientAppointmentView) => void;
}

export function FutureAppointmentsPreview({ 
  appointments, 
  hasMore,
  hasNextAppointment,
  onAppointmentClick
}: FutureAppointmentsPreviewProps) {
  if (appointments.length === 0) return null;

  const sectionTitle = hasNextAppointment ? "Altri appuntamenti" : "Appuntamenti futuri";

  return (
    <section>
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
        {sectionTitle}
      </p>
      
      <div className="space-y-2">
        {appointments.map((appointment) => {
          const startDate = new Date(appointment.startAt);
          const endDate = new Date(appointment.endAt);
          const formattedDate = format(startDate, "EEEE d MMM", { locale: it });
          const formattedTime = `${format(startDate, "HH:mm")} – ${format(endDate, "HH:mm")}`;

          return (
            <Card 
              key={appointment.id}
              className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onAppointmentClick(appointment)}
              data-testid="future-card"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium capitalize text-foreground truncate">{formattedDate}</p>
                    <p className="text-sm text-muted-foreground">{formattedTime}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {hasMore && (
        <Link 
          to="/client/app/appointments/all" 
          className="block text-sm text-primary hover:underline mt-3 text-center"
        >
          Vedi tutti gli appuntamenti
        </Link>
      )}
    </section>
  );
}
