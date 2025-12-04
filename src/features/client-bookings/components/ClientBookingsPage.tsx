import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientBookingSettings } from "../hooks/useClientBookingSettings";
import { useClientAppointmentsView } from "../hooks/useClientAppointmentsView";
import { CurrentSituationCard } from "./CurrentSituationCard";
import { AppointmentsList } from "./AppointmentsList";
import { AppointmentDetailSheet } from "./AppointmentDetailSheet";
import { SlotSelectorSheet } from "./SlotSelectorSheet";
import type { ClientAppointmentView } from "../types";

export function ClientBookingsPage() {
  const { data: settings, isLoading: settingsLoading } = useClientBookingSettings();
  const { data: appointments, isLoading: appointmentsLoading } = useClientAppointmentsView();
  
  const [selectedAppointment, setSelectedAppointment] = useState<ClientAppointmentView | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  const handleViewDetail = (appointment: ClientAppointmentView) => {
    setSelectedAppointment(appointment);
    setDetailOpen(true);
  };

  const handleOpenBooking = () => {
    setBookingOpen(true);
  };

  const isLoading = settingsLoading || appointmentsLoading;
  const bookingEnabled = settings?.enabled ?? false;

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-40" />
        <Skeleton className="h-12" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Prenotazioni</h1>
        <p className="text-sm text-muted-foreground">
          Gestisci i tuoi appuntamenti con il coach
        </p>
      </div>

      {/* Current Situation Card */}
      <CurrentSituationCard
        appointments={appointments || []}
        bookingEnabled={bookingEnabled}
        onBook={handleOpenBooking}
        onViewDetail={handleViewDetail}
      />

      {/* CTA - solo se booking abilitato */}
      {bookingEnabled && (
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleOpenBooking}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Prenota un appuntamento
        </Button>
      )}

      {/* Collapsible Lists */}
      <AppointmentsList 
        appointments={appointments || []}
        onSelect={handleViewDetail}
      />

      {/* Detail Sheet */}
      <AppointmentDetailSheet
        appointment={selectedAppointment}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Slot Selector Sheet */}
      <SlotSelectorSheet
        open={bookingOpen}
        onOpenChange={setBookingOpen}
      />
    </div>
  );
}
