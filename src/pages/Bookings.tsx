import { useState, useMemo } from "react";
import { format, parseISO, differenceInHours } from "date-fns";
import { it } from "date-fns/locale";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, CheckCircle, XCircle, Clock, Calendar, User } from "lucide-react";
import { useBookingRequestsQuery } from "@/features/bookings/hooks/useBookingRequests";
import {
  useApproveBookingRequest,
  useDeclineBookingRequest,
} from "@/features/bookings/hooks/useBookingRequests";
import { BookingRequestDrawer } from "@/features/bookings/components/BookingRequestDrawer";
import { formatTimeRange } from "@/features/events/utils/calendar-utils";
import { useDebounce } from "@/hooks/use-debounce";
import type { BookingRequestWithClient, BookingRequestStatus } from "@/features/bookings/types";

const Bookings = () => {
  const [activeTab, setActiveTab] = useState<BookingRequestStatus>("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BookingRequestWithClient | undefined>();

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: allRequests = [], isLoading } = useBookingRequestsQuery();
  const approveMutation = useApproveBookingRequest();
  const declineMutation = useDeclineBookingRequest();

  // Filter by tab and search
  const filteredRequests = useMemo(() => {
    let filtered = allRequests.filter((r) => r.status === activeTab);

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter((r) =>
        r.client_name.toLowerCase().includes(query)
      );
    }

    return filtered.sort(
      (a, b) =>
        new Date(a.requested_start_at).getTime() -
        new Date(b.requested_start_at).getTime()
    );
  }, [allRequests, activeTab, debouncedSearch]);

  const handleRowClick = (request: BookingRequestWithClient) => {
    setSelectedRequest(request);
    setDrawerOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredRequests.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((rowId) => rowId !== id));
    }
  };

  const handleBulkApprove = async () => {
    if (!selectedIds.length) return;
    
    if (confirm(`Vuoi approvare ${selectedIds.length} richieste?`)) {
      for (const id of selectedIds) {
        await approveMutation.mutateAsync(id);
      }
      setSelectedIds([]);
    }
  };

  const handleBulkDecline = async () => {
    if (!selectedIds.length) return;
    
    if (confirm(`Sei sicuro di voler rifiutare ${selectedIds.length} richieste?`)) {
      for (const id of selectedIds) {
        await declineMutation.mutateAsync(id);
      }
      setSelectedIds([]);
    }
  };

  const getTimeUntilAppointment = (startAt: string) => {
    const hours = differenceInHours(parseISO(startAt), new Date());
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}g`;
  };

  const getStatusBadge = (status: BookingRequestStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-600">
            <Clock className="h-3 w-3 mr-1" />
            In attesa
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approvato
          </Badge>
        );
      case "DECLINED":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Rifiutato
          </Badge>
        );
      case "COUNTER_PROPOSED":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Clock className="h-3 w-3 mr-1" />
            Controproposta
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background w-full">
      <PageHeader
        title="Prenotazioni"
        subtitle="Gestisci le richieste di appuntamento dei tuoi clienti"
      />

      <div className="flex-1 overflow-y-auto mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BookingRequestStatus)}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="PENDING">
                In attesa
                {allRequests.filter((r) => r.status === "PENDING").length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {allRequests.filter((r) => r.status === "PENDING").length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="APPROVED">Approvati</TabsTrigger>
              <TabsTrigger value="DECLINED">Rifiutati</TabsTrigger>
            </TabsList>

            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {selectedIds.length > 0 && activeTab === "PENDING" && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedIds.length} selezionate
              </span>
              <Button
                size="sm"
                onClick={handleBulkApprove}
                disabled={approveMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approva tutto
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDecline}
                disabled={declineMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rifiuta tutto
              </Button>
            </div>
          )}

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Caricamento richieste...</div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Nessuna richiesta trovata"
                    : activeTab === "PENDING"
                    ? "Nessuna richiesta in attesa"
                    : activeTab === "APPROVED"
                    ? "Nessuna richiesta approvata"
                    : "Nessuna richiesta rifiutata"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {activeTab === "PENDING" && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedIds.length === filteredRequests.length &&
                              filteredRequests.length > 0
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                      )}
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data e ora</TableHead>
                      <TableHead>Stato</TableHead>
                      {activeTab === "PENDING" && <TableHead>Tra</TableHead>}
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow
                        key={request.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(request)}
                      >
                        {activeTab === "PENDING" && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.includes(request.id)}
                              onCheckedChange={(checked) =>
                                handleSelectRow(request.id, checked as boolean)
                              }
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{request.client_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {format(parseISO(request.requested_start_at), "d MMM yyyy", {
                                locale: it,
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatTimeRange(
                                request.requested_start_at,
                                request.requested_end_at,
                                false
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        {activeTab === "PENDING" && (
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {getTimeUntilAppointment(request.requested_start_at)}
                            </span>
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(request);
                            }}
                          >
                            Dettagli
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BookingRequestDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        request={selectedRequest}
      />
    </div>
  );
};

export default Bookings;
