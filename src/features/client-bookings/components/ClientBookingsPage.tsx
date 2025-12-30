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
import { CounterProposalBanner } from "./CounterProposalBanner";
import { AppointmentDetailSheet } from "./AppointmentDetailSheet";
import { SlotSelectorSheet } from "./SlotSelectorSheet";
import { useRespondToChangeProposal } from "../hooks/useRespondToChangeProposal";
import { useRespondToCounterProposal } from "../hooks/useRespondToCounterProposal";
import type { ClientAppointmentView } from "../types";

export function ClientBookingsPage() {
  const { data: settings, isLoading: settingsLoading } = useClientBookingSettings();
  const { data: appointments, isLoading: appointmentsLoading } = useClientAppointmentsView();
  const { accept: acceptProposal, reject: rejectProposal, isPending: proposalLoading } = useRespondToChangeProposal();
  const { accept: acceptCounterProposal, reject: rejectCounterProposal, isPending: counterProposalLoading } = useRespondToCounterProposal();
  
  const [selectedAppointment, setSelectedAppointment] = useState<ClientAppointmentView | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  // Separate appointments: upcoming (future, not cancelled), and filter by status
  const { nextAppointment, futureAppointments, proposalAppointment, counterProposalAppointment } = useMemo(() => {
    if (!appointments) {
      return { nextAppointment: null, futureAppointments: [], proposalAppointment: null, counterProposalAppointment: null };
    }

    const now = new Date();
    const upcoming = appointments
      .filter(a => new Date(a.startAt) > now && a.status !== 'CANCELLED' && a.status !== 'COMPLETED')
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    // Check if there's a change proposal (event) that needs attention
    const proposal = upcoming.find(a => a.status === 'CHANGE_PROPOSED');
    
    // Check if there's a counter proposal (booking request) that needs attention
    const counterProposal = upcoming.find(a => a.status === 'COUNTER_PROPOSAL');
    
    // Next appointment is the first upcoming confirmed or requested one
    const next = upcoming.find(a => a.status === 'CONFIRMED' || a.status === 'REQUESTED') || null;
    
    // Future appointments exclude the next one and any proposals
    const future = upcoming.filter(a => 
      a !== next && 
      a.status !== 'CHANGE_PROPOSED' && 
      a.status !== 'COUNTER_PROPOSAL'
    );

    return { 
      nextAppointment: next, 
      futureAppointments: future,
      proposalAppointment: proposal,
      counterProposalAppointment: counterProposal
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

  const handleAcceptCounterProposal = () => {
    if (counterProposalAppointment) {
      acceptCounterProposal(counterProposalAppointment.id);
    }
  };

  const handleRejectCounterProposal = () => {
    if (counterProposalAppointment) {
      rejectCounterProposal(counterProposalAppointment.id);
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

      {/* Counter Proposal Banner - shown if coach proposed alternative time for booking request */}
      {counterProposalAppointment && (
        <CounterProposalBanner
          appointment={counterProposalAppointment}
          onAccept={handleAcceptCounterProposal}
          onReject={handleRejectCounterProposal}
          isLoading={counterProposalLoading}
        />
      )}

      {/* Change Proposal Banner - shown if coach proposed alternative time for existing event */}
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
