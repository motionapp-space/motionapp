import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle2 } from "lucide-react";
import { useTopbar } from "@/contexts/TopbarContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingRequestCard } from "@/features/bookings/components/BookingRequestCard";
import { BookingRequestDrawer } from "@/features/bookings/components/BookingRequestDrawer";
import { useBookingRequestsQuery } from "@/features/bookings/hooks/useBookingRequests";
import type { BookingRequestWithClient } from "@/features/bookings/types";

const BookingManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: allRequests = [] } = useBookingRequestsQuery({});
  const { data: pendingRequests = [] } = useBookingRequestsQuery({ status: "PENDING" });

  const [selectedRequest, setSelectedRequest] = useState<BookingRequestWithClient | undefined>();
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false);

  // Count requests by status
  const approvedCount = allRequests.filter(r => r.status === "APPROVED").length;
  const declinedCount = allRequests.filter(r => r.status === "DECLINED").length;

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

  return (
    <div className="min-h-screen flex flex-col bg-background w-full">
      <div className="flex-1 overflow-auto mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
        <div className="space-y-6">
          {/* Summary Counters */}
          <div className="flex flex-wrap gap-4">
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Da approvare</p>
                    <p className="text-3xl font-bold text-blue-600">{pendingRequests.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Approvate</p>
                    <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Eliminate</p>
                    <p className="text-3xl font-bold text-muted-foreground">{declinedCount}</p>
                  </div>
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
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <BookingRequestCard
                      key={request.id}
                      request={request}
                      onClick={() => handleRequestClick(request)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Request Detail Drawer */}
      <BookingRequestDrawer
        open={requestDrawerOpen}
        onOpenChange={setRequestDrawerOpen}
        request={selectedRequest}
      />
    </div>
  );
};

export default BookingManagement;
