import { useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { CalendarX } from "lucide-react";
import { parseISO, addDays, startOfDay, endOfDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

import { useTopbar } from "@/contexts/TopbarContext";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

import { BookingRequestListItem } from "@/features/bookings/components/BookingRequestListItem";
import { useBookingRequestsQuery } from "@/features/bookings/hooks/useBookingRequests";
import { useBookingSettingsQuery } from "@/features/bookings/hooks/useBookingSettingsQuery";
import {
  useApproveBookingRequestOptimistic,
  useDeclineBookingRequestOptimistic,
  useCounterProposeBookingRequestOptimistic,
} from "@/features/bookings/hooks/useBookingRequestMutations";
import { getAvailableSlots } from "@/features/bookings/api/available-slots.api";
import { findNearestSlots } from "@/features/bookings/utils/slot-generator";
import type { BookingRequestWithClient } from "@/features/bookings/types";

const BookingManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: currentUser } = useCurrentUser();

  // Queries - PENDING first (priority), then COUNTER_PROPOSED
  const { data: pendingRequests = [] } = useBookingRequestsQuery({ status: "PENDING" });
  const { data: counterProposedRequests = [] } = useBookingRequestsQuery({
    status: "COUNTER_PROPOSED",
  });
  const { data: bookingSettings, isLoading: isLoadingSettings } = useBookingSettingsQuery();

  // Mutations with optimistic updates
  const approveMutation = useApproveBookingRequestOptimistic();
  const declineMutation = useDeclineBookingRequestOptimistic();
  const counterProposeMutation = useCounterProposeBookingRequestOptimistic();

  // Set topbar
  useTopbar({
    title: "Gestione prenotazioni",
    showBack: true,
    onBack: () => navigate("/calendar"),
  });

  // Redirect if trying to access settings tab
  useEffect(() => {
    if (searchParams.get("tab") === "settings") {
      navigate("/settings", { replace: true });
    }
  }, [searchParams, navigate]);

  // Lazy load alternatives for a specific request
  const loadAlternativesForRequest = useCallback(
    async (request: BookingRequestWithClient) => {
      if (!currentUser?.id) return [];

      const requestedDate = parseISO(request.requested_start_at);
      const slots = await getAvailableSlots({
        coachId: currentUser.id,
        startDate: startOfDay(requestedDate).toISOString(),
        endDate: endOfDay(addDays(requestedDate, 7)).toISOString(),
        calendarMode: "client",
      });

      // Find nearest slots excluding the original request time
      return findNearestSlots(requestedDate, slots, request.requested_start_at);
    },
    [currentUser?.id]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[960px] px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Gestione prenotazioni</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Approva, rifiuta o proponi un altro orario
          </p>
        </div>

        {/* KPI Compatti Inline */}
        <div className="flex items-center gap-8 mb-8">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold">{pendingRequests.length}</span>
            <span className="text-sm text-muted-foreground">da approvare</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold text-muted-foreground">
              {counterProposedRequests.length}
            </span>
            <span className="text-sm text-muted-foreground">in attesa risposta</span>
          </div>
        </div>

        {/* Alert when bookings disabled */}
        {!isLoadingSettings && bookingSettings?.enabled !== true && (
          <div className="flex items-center gap-4 p-4 mb-6 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="rounded-full bg-amber-500/10 p-2.5 shrink-0">
              <CalendarX className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-foreground">
                Prenotazioni self-service disabilitate
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                I tuoi clienti non possono prenotare autonomamente sul calendario
              </p>
            </div>
            <Button asChild size="sm">
              <Link to="/settings?tab=bookings">Abilita</Link>
            </Button>
          </div>
        )}

        {/* Sezione: Da approvare (PRIMA - priorità) */}
        <section className="mb-8">
          <h2 className="text-base font-semibold mb-4">Da approvare</h2>
          {pendingRequests.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Nessuna richiesta da approvare.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    layout
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  >
                <BookingRequestListItem
                  key={request.id}
                  request={request}
                  onApprove={async () => { await approveMutation.mutateAsync(request.id); }}
                  onDecline={async () => { await declineMutation.mutateAsync(request.id); }}
                  onCounterPropose={async (startAt, endAt) => {
                    await counterProposeMutation.mutateAsync({
                      requestId: request.id,
                      startAt,
                      endAt,
                    });
                  }}
                  loadAlternatives={() => loadAlternativesForRequest(request)}
                />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </section>

        {/* Sezione: In attesa risposta cliente (DOPO) */}
        {counterProposedRequests.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-4">In attesa risposta cliente</h2>
            <div className="space-y-3">
              {counterProposedRequests.map((request) => (
                <BookingRequestListItem
                  key={request.id}
                  request={request}
                  onApprove={() => Promise.resolve()}
                  onDecline={() => Promise.resolve()}
                  onCounterPropose={() => Promise.resolve()}
                  loadAlternatives={() => Promise.resolve([])}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default BookingManagement;