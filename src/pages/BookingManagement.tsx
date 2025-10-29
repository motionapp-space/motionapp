import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import { useBookingSettingsQuery, useUpdateBookingSettings } from "@/features/bookings/hooks/useBookingSettings";
import { AvailabilityEditor } from "@/features/bookings/components/AvailabilityEditor";
import { OutOfOfficeManager } from "@/features/bookings/components/OutOfOfficeManager";
import { BookingRequestCard } from "@/features/bookings/components/BookingRequestCard";
import { BookingRequestDrawer } from "@/features/bookings/components/BookingRequestDrawer";
import { useBookingRequestsQuery } from "@/features/bookings/hooks/useBookingRequests";
import type { BookingRequestWithClient } from "@/features/bookings/types";

const BookingManagement = () => {
  const navigate = useNavigate();
  const { data: settings } = useBookingSettingsQuery();
  const updateMutation = useUpdateBookingSettings();
  const { data: allRequests = [] } = useBookingRequestsQuery({});
  const { data: pendingRequests = [] } = useBookingRequestsQuery({ status: "PENDING" });

  const [formData, setFormData] = useState({
    enabled: false,
    min_advance_notice_hours: 24,
    slot_duration_minutes: 60,
    approval_mode: "AUTO" as "AUTO" | "MANUAL",
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BookingRequestWithClient | undefined>();
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        enabled: settings.enabled ?? false,
        min_advance_notice_hours: settings.min_advance_notice_hours ?? 24,
        slot_duration_minutes: settings.slot_duration_minutes ?? 60,
        approval_mode: settings.approval_mode ?? "AUTO",
      });
    }
  }, [settings]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await updateMutation.mutateAsync(formData);
    setHasChanges(false);
  };

  const handleRequestClick = (request: BookingRequestWithClient) => {
    setSelectedRequest(request);
    setRequestDrawerOpen(true);
  };

  // Count requests by status
  const approvedCount = allRequests.filter(r => r.status === "APPROVED").length;
  const declinedCount = allRequests.filter(r => r.status === "DECLINED").length;

  return (
    <div className="min-h-screen flex flex-col bg-background w-full">
      <PageHeader
        title="Gestione prenotazioni"
        subtitle="Organizza e approva le richieste dei tuoi clienti"
        toolbarLeft={
          <Button
            variant="ghost"
            onClick={() => navigate("/calendar")}
            className="gap-2 h-10"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna agli appuntamenti
          </Button>
        }
      />

      <div className="flex-1 overflow-auto mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="requests">
              Richieste
              {pendingRequests.length > 0 && (
                <Badge variant="default" className="ml-2 h-5 min-w-5 px-1.5">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">Impostazioni</TabsTrigger>
          </TabsList>

          {/* Tab 1: Richieste */}
          <TabsContent value="requests" className="space-y-6">
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
          </TabsContent>

          {/* Tab 2: Impostazioni */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Impostazioni generali</CardTitle>
                <CardDescription>Configura come i clienti possono prenotare</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enabled">Prenotazioni self-service</Label>
                    <p className="text-sm text-muted-foreground">
                      Consenti ai clienti di prenotare autonomamente gli slot disponibili
                    </p>
                  </div>
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => handleFieldChange("enabled", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-advance">Preavviso minimo</Label>
                  <Select
                    value={formData.min_advance_notice_hours.toString()}
                    onValueChange={(value) =>
                      handleFieldChange("min_advance_notice_hours", parseInt(value))
                    }
                  >
                    <SelectTrigger id="min-advance">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 ore</SelectItem>
                      <SelectItem value="24">24 ore</SelectItem>
                      <SelectItem value="48">48 ore</SelectItem>
                      <SelectItem value="72">72 ore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slot-duration">Durata slot</Label>
                  <Select
                    value={formData.slot_duration_minutes.toString()}
                    onValueChange={(value) =>
                      handleFieldChange("slot_duration_minutes", parseInt(value))
                    }
                  >
                    <SelectTrigger id="slot-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minuti</SelectItem>
                      <SelectItem value="45">45 minuti</SelectItem>
                      <SelectItem value="60">60 minuti</SelectItem>
                      <SelectItem value="90">90 minuti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="approval-mode">Modalità di approvazione</Label>
                  <Select
                    value={formData.approval_mode.toLowerCase()}
                    onValueChange={(value) =>
                      handleFieldChange("approval_mode", value.toUpperCase())
                    }
                  >
                    <SelectTrigger id="approval-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>Automatica</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="manual">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span>Manuale</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {formData.approval_mode === "AUTO" 
                      ? "Le richieste vengono approvate automaticamente"
                      : "Dovrai approvare manualmente ogni richiesta"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fasce orarie settimanali</CardTitle>
                <CardDescription>
                  Definisci quando sei disponibile per le prenotazioni
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AvailabilityEditor />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Periodi di assenza</CardTitle>
                <CardDescription>
                  Blocca date specifiche per ferie o altri impegni
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OutOfOfficeManager />
              </CardContent>
            </Card>

            {hasChanges && (
              <div className="sticky bottom-0 bg-background border-t pt-4 pb-2 flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setHasChanges(false)}>
                  Annulla
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Salvataggio..." : "Salva modifiche"}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
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
