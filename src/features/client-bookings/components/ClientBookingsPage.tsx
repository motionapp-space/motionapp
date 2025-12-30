import { useState, useMemo } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientPageHeader } from "@/components/client/ClientPageHeader";
import { useClientBookingSettings } from "../hooks/useClientBookingSettings";
import { useClientAppointmentsView } from "../hooks/useClientAppointmentsView";
import { NextAppointmentCard } from "./NextAppointmentCard";
import { FutureAppointmentsSection } from "./FutureAppointmentsSection";
import { ChangeProposalBanner } from "./ChangeProposalBanner";
import { AppointmentDetailSheet } from "./AppointmentDetailSheet";
import { SlotSelectorSheet } from "./SlotSelectorSheet";
import { useRespondToChangeProposal } from "../hooks/useRespondToChangeProposal";
import type { ClientAppointmentView } from "../types";

export function ClientBookingsPage() {
  const { data: settings, isLoading: settingsLoading } = useClientBookingSettings();
  const { data: appointments, isLoading: appointmentsLoading } = useClientAppointmentsView();
  const { accept: acceptProposal, reject: rejectProposal, isPending: proposalLoading } = useRespondToChangeProposal();
  
  const [selectedAppointment, setSelectedAppointment] = useState<ClientAppointmentView | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  // Separate appointments: upcoming (future, not cancelled), and filter by status
  const { nextAppointment, futureAppointments, proposalAppointment } = useMemo(() => {
    if (!appointments) {
      return { nextAppointment: null, futureAppointments: [], proposalAppointment: null };
    }

    const now = new Date();
    const upcoming = appointments
      .filter(a => new Date(a.startAt) > now && a.status !== 'CANCELLED' && a.status !== 'COMPLETED')
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    // Check if there's a proposal that needs attention
    const proposal = upcoming.find(a => a.status === 'CHANGE_PROPOSED');
    
    // Next appointment is the first upcoming one
    const next = upcoming[0] || null;
    
    // Future appointments exclude the first one (shown in NextAppointmentCard)
    const future = upcoming.slice(1);

    return { 
      nextAppointment: next, 
      futureAppointments: future,
      proposalAppointment: proposal 
    };
  }, [appointments]);

  const handleViewDetail = (appointment: ClientAppointmentView) => {
    setSelectedAppointment(appointment);
    setDetailOpen(true);
  };

  const handleOpenBooking = () => {
    setBookingOpen(true);
  };

  const handleAcceptProposal = () => {
    if (proposalAppointment) {
      acceptProposal(proposalAppointment.id);
    }
  };

  const handleRejectProposal = () => {
    if (proposalAppointment) {
      rejectProposal(proposalAppointment.id);
    }
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
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
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

      {/* Change Proposal Banner - shown above next appointment if there's a proposal */}
      {proposalAppointment && (
        <ChangeProposalBanner
          appointment={proposalAppointment}
          onAccept={handleAcceptProposal}
          onReject={handleRejectProposal}
          isLoading={proposalLoading}
        />
      )}

      {/* Next Appointment Section */}
      <section>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
          Prossimo appuntamento
        </p>
        <NextAppointmentCard
          appointment={nextAppointment}
          isLoading={false}
          onClick={() => nextAppointment && handleViewDetail(nextAppointment)}
        />
      </section>

      {/* CTA - only if booking enabled */}
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

      {/* Future Appointments Section */}
      <FutureAppointmentsSection
        appointments={futureAppointments}
        isLoading={false}
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
