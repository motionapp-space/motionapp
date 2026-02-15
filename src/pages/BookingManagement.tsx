import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Clock, CalendarX, MessageCircle } from "lucide-react";
import { useTopbar } from "@/contexts/TopbarContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { PendingRequestCard } from "@/features/bookings/components/PendingRequestCard";
import { CounterProposedRequestCard } from "@/features/bookings/components/CounterProposedRequestCard";
import { CounterProposeDialog } from "@/features/bookings/components/CounterProposeDialog";
import { BookingRequestDrawer } from "@/features/bookings/components/BookingRequestDrawer";
import { useBookingRequestsQuery } from "@/features/bookings/hooks/useBookingRequests";
import { useBookingSettingsQuery } from "@/features/bookings/hooks/useBookingSettingsQuery";
import { useApproveBookingRequest } from "@/features/bookings/hooks/useApproveBookingRequest";
import { useDeclineBookingRequest } from "@/features/bookings/hooks/useDeclineBookingRequest";
import { useCounterProposeBookingRequest } from "@/features/bookings/hooks/useCounterProposeBookingRequest";
import type { BookingRequestWithClient } from "@/features/bookings/types";

const BookingManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Query only PENDING and COUNTER_PROPOSED (no allRequests - performance optimization)
  const { data: pendingRequests = [] } = useBookingRequestsQuery({ status: "PENDING" });
  const { data: counterProposedRequests = [] } = useBookingRequestsQuery({ status: "COUNTER_PROPOSED" });
  const { data: bookingSettings, isLoading: isLoadingSettings } = useBookingSettingsQuery();

  const [selectedRequest, setSelectedRequest] = useState<BookingRequestWithClient | undefined>();
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false);
  const [counterProposeDialogOpen, setCounterProposeDialogOpen] = useState(false);
  const [requestToCounterPropose, setRequestToCounterPropose] = useState<BookingRequestWithClient | null>(null);

  // Mutations
  const approveMutation = useApproveBookingRequest();
  const declineMutation = useDeclineBookingRequest();
  const counterProposeMutation = useCounterProposeBookingRequest();

  // Set topbar
  useTopbar({
    title: "Gestione prenotazioni",
    showBack: true,
    onBack: () => navigate("/calendar"),
  });

  // Redirect if trying to access settings tab
  useEffect(() => {
    if (searchParams.get('tab') === 'settings') {
      navigate('/settings', { replace: true });
    }
  }, [searchParams, navigate]);

  const handleRequestClick = (request: BookingRequestWithClient) => {
    setSelectedRequest(request);
    setRequestDrawerOpen(true);
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleDecline = (id: string) => {
    declineMutation.mutate(id);
  };

  const handleOpenCounterPropose = (request: BookingRequestWithClient) => {
    setRequestToCounterPropose(request);
    setCounterProposeDialogOpen(true);
  };

  const handleCounterProposeSubmit = (id: string, startAt: string, endAt: string) => {
    counterProposeMutation.mutate(
      { id, startAt, endAt },
      {
        onSuccess: () => {
          setCounterProposeDialogOpen(false);
          setRequestToCounterPropose(null);
        },
      }
    );
  };

  const handleDeleteCounterProposed = (id: string) => {
    declineMutation.mutate(id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background w-full">
      <div className="flex-1 overflow-auto mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
        <div className="space-y-6">
          {/* Alert when bookings disabled */}
          {!isLoadingSettings && bookingSettings?.enabled !== true && (
            <Card className="border-warning/40 bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-warning/10 p-2.5 shrink-0">
                    <CalendarX className="h-5 w-5 text-warning" />
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
              </CardContent>
            </Card>
          )}

          {/* Summary Counters */}
          <div className="flex flex-wrap gap-4">
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Da approvare</p>
                    <p className="text-3xl font-bold text-foreground">{pendingRequests.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In attesa risposta</p>
                    <p className="text-3xl font-bold text-amber-600">{counterProposedRequests.length}</p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-amber-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Requests List */}
          <Card>
            <CardHeader>
              <CardTitle>Richieste in attesa</CardTitle>
              <CardDescription>
                Approva, rifiuta o controproponi un'altra data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    Nessuna richiesta da approvare. I clienti possono prenotare in base alle tue disponibilità.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingRequests.map((request) => (
                    <PendingRequestCard
                      key={request.id}
                      request={request}
                      onApprove={handleApprove}
                      onDecline={handleDecline}
                      onCounterPropose={handleOpenCounterPropose}
                      isApproving={approveMutation.isPending}
                      isDeclining={declineMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Counter Proposed Requests List */}
          {counterProposedRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>In attesa risposta cliente</CardTitle>
                <CardDescription>
                  Controproposte inviate, in attesa di accettazione
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {counterProposedRequests.map((request) => (
                    <CounterProposedRequestCard
                      key={request.id}
                      request={request}
                      onDelete={handleDeleteCounterProposed}
                      isDeleting={declineMutation.isPending}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Request Detail Drawer (fallback for edge cases) */}
      <BookingRequestDrawer
        open={requestDrawerOpen}
        onOpenChange={setRequestDrawerOpen}
        request={selectedRequest}
      />

      {/* Counter Propose Dialog */}
      <CounterProposeDialog
        request={requestToCounterPropose}
        open={counterProposeDialogOpen}
        onOpenChange={setCounterProposeDialogOpen}
        onSubmit={handleCounterProposeSubmit}
        isSubmitting={counterProposeMutation.isPending}
      />
    </div>
  );
};

export default BookingManagement;
