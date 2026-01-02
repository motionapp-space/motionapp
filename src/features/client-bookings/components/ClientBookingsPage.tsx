import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientPageHeader } from "@/components/client/ClientPageHeader";
import { useClientBookingSettings } from "../hooks/useClientBookingSettings";
import { useClientAppointmentsView } from "../hooks/useClientAppointmentsView";
import { useClientRecentActivity } from "../hooks/useClientRecentActivity";
import { useRespondToCounterProposal } from "../hooks/useRespondToCounterProposal";
import { useCancelBookingRequest } from "../hooks/useCancelBookingRequest";
import { NextAppointmentHeroCard } from "./NextAppointmentHeroCard";
import { BookingCTA } from "./BookingCTA";
import { ActiveRequestsSection } from "./ActiveRequestsSection";
import { FutureAppointmentsPreview } from "./FutureAppointmentsPreview";
import { RecentActivitySection } from "./RecentActivitySection";
import { AppointmentDetailSheet } from "./AppointmentDetailSheet";
import { SlotSelectorSheet } from "./SlotSelectorSheet";
import type { ClientAppointmentView } from "../types";

export function ClientBookingsPage() {
  const { data: settings, isLoading: settingsLoading } = useClientBookingSettings();
  const { data: appointments, isLoading: appointmentsLoading } = useClientAppointmentsView();
  const { data: recentActivity = [], isLoading: activityLoading } = useClientRecentActivity();
  const { accept: acceptCounterProposal, reject: rejectCounterProposal, isPending: counterProposalLoading } = useRespondToCounterProposal();
  const cancelRequestMutation = useCancelBookingRequest();
  
  const [selectedAppointment, setSelectedAppointment] = useState<ClientAppointmentView | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  // Derive views from appointments data
  const { 
    nextConfirmed,
    activeRequests,
    futureConfirmed,
    hasMoreFuture
  } = useMemo(() => {
    if (!appointments) {
      return { 
        nextConfirmed: null, 
        activeRequests: [], 
        futureConfirmed: [],
        hasMoreFuture: false
      };
    }

    const now = new Date();

    // Confirmed future appointments (sorted by date)
    const confirmed = appointments
      .filter(a => a.status === 'CONFIRMED' && new Date(a.startAt) > now)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    // Active requests: COUNTER_PROPOSAL first, then REQUESTED (sorted by date within each group)
    const requests = appointments
      .filter(a => a.status === 'COUNTER_PROPOSAL' || a.status === 'REQUESTED')
      .sort((a, b) => {
        // COUNTER_PROPOSAL before REQUESTED
        if (a.status === 'COUNTER_PROPOSAL' && b.status !== 'COUNTER_PROPOSAL') return -1;
        if (b.status === 'COUNTER_PROPOSAL' && a.status !== 'COUNTER_PROPOSAL') return 1;
        // Within same status, sort by date
        return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
      });

    return {
      nextConfirmed: confirmed[0] || null,
      activeRequests: requests,
      futureConfirmed: confirmed.slice(1, 4), // Max 3, excluding hero
      hasMoreFuture: confirmed.length > 4     // More than hero + 3
    };
  }, [appointments]);

  const handleViewDetail = (appointment: ClientAppointmentView) => {
    setSelectedAppointment(appointment);
    setDetailOpen(true);
  };

  const handleOpenBooking = () => {
    setBookingOpen(true);
  };

  const handleAcceptCounterProposal = (id: string) => {
    acceptCounterProposal(id);
  };

  const handleRejectCounterProposal = (id: string) => {
    rejectCounterProposal(id);
  };

  const handleCancelRequest = (id: string) => {
    cancelRequestMutation.mutate(id);
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
        <Skeleton className="h-20 rounded-xl" />
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

      {/* Section 1: Next Appointment Hero */}
      <section>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
          Prossimo appuntamento
        </p>
        <NextAppointmentHeroCard
          appointment={nextConfirmed}
          onClick={() => nextConfirmed && handleViewDetail(nextConfirmed)}
        />
      </section>

      {/* CTA: Book Appointment */}
      <BookingCTA 
        enabled={bookingEnabled}
        onBook={handleOpenBooking}
      />

      {/* Section 2: Active Requests */}
      <ActiveRequestsSection
        requests={activeRequests}
        onAcceptCounter={handleAcceptCounterProposal}
        onRejectCounter={handleRejectCounterProposal}
        onCancelRequest={handleCancelRequest}
        isLoading={counterProposalLoading || cancelRequestMutation.isPending}
      />

      {/* Section 3: Future Appointments Preview */}
      <FutureAppointmentsPreview
        appointments={futureConfirmed}
        hasMore={hasMoreFuture}
        hasNextAppointment={!!nextConfirmed}
        onAppointmentClick={handleViewDetail}
      />

      {/* Section 4: Recent Activity (Collapsible) */}
      {!activityLoading && (
        <RecentActivitySection items={recentActivity} />
      )}

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
