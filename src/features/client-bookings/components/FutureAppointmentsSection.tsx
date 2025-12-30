import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { ClientEmptyState } from "@/components/client/ClientEmptyState";
import { FutureAppointmentCard } from "./FutureAppointmentCard";
import { AppointmentDetailSheet } from "./AppointmentDetailSheet";
import type { ClientAppointmentView } from "../types";

interface FutureAppointmentsSectionProps {
  appointments: ClientAppointmentView[];
  isLoading: boolean;
}

export function FutureAppointmentsSection({ 
  appointments, 
  isLoading 
}: FutureAppointmentsSectionProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<ClientAppointmentView | null>(null);
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <section>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
          Appuntamenti futuri
        </p>
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </section>
    );
  }

  const displayedAppointments = showAll ? appointments : appointments.slice(0, 3);
  const hasMore = appointments.length > 3;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Appuntamenti futuri
        </p>
        {hasMore && !showAll && (
          <Button 
            variant="link" 
            size="sm" 
            className="h-auto p-0 text-xs"
            onClick={() => setShowAll(true)}
          >
            Mostra tutti
          </Button>
        )}
      </div>

      {appointments.length === 0 ? (
        <Card className="border-dashed shadow-sm">
          <CardContent className="p-5">
            <ClientEmptyState
              icon={CalendarDays}
              title="Nessun appuntamento futuro"
              description="I tuoi prossimi appuntamenti appariranno qui"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {displayedAppointments.map((appointment) => (
            <FutureAppointmentCard
              key={appointment.id}
              appointment={appointment}
              onClick={() => setSelectedAppointment(appointment)}
            />
          ))}
        </div>
      )}

      <AppointmentDetailSheet
        appointment={selectedAppointment}
        open={!!selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
      />
    </section>
  );
}
