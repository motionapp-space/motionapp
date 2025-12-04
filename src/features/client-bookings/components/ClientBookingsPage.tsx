import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientPageHeader } from "@/components/client/ClientPageHeader";
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
      <div className="px-5 py-5 space-y-6 pb-24">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="px-5 py-5 space-y-6 pb-24">
      {/* Header */}
      <ClientPageHeader 
        title="Prenotazioni" 
        description="Gestisci i tuoi appuntamenti con il coach"
      />

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
          className="w-full h-12" 
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
