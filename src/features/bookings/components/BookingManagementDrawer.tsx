import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Settings2, Clock, CheckCircle2 } from "lucide-react";
import { useBookingSettingsQuery } from "../hooks/useBookingSettingsQuery";
import { useUpdateBookingSettings } from "../hooks/useUpdateBookingSettings";
import { AvailabilityEditor } from "./AvailabilityEditor";
import { OutOfOfficeManager } from "./OutOfOfficeManager";
import { BookingRequestCard } from "./BookingRequestCard";
import { BookingRequestDrawer } from "./BookingRequestDrawer";
import { useBookingRequestsQuery } from "../hooks/useBookingRequests";
import type { BookingRequestWithClient } from "../types";

interface BookingManagementDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingManagementDrawer({ open, onOpenChange }: BookingManagementDrawerProps) {
  const { data: settings } = useBookingSettingsQuery();
  const updateMutation = useUpdateBookingSettings();
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

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <div className="sticky top-0 bg-background border-b z-10">
            <SheetHeader className="px-6 py-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <SheetTitle className="text-xl">Gestione prenotazioni</SheetTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configura disponibilità e gestisci le richieste
                  </p>
                </div>
              </div>
            </SheetHeader>
          </div>

          <div className="p-6 space-y-6">
            {/* Quick Settings Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Impostazioni generali</CardTitle>
                </div>
                <CardDescription>Configura come i clienti possono prenotare</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enabled">Prenotazioni self-service</Label>
                    <p className="text-sm text-muted-foreground">
                      Permetti ai clienti di prenotare autonomamente
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
                </div>

                {hasChanges && (
                  <Button onClick={handleSave} className="w-full" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Salvataggio..." : "Salva impostazioni"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Tabs for Advanced Settings */}
            <Tabs defaultValue="availability" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="availability">Disponibilità</TabsTrigger>
                <TabsTrigger value="ooo">Fuori ufficio</TabsTrigger>
                <TabsTrigger value="pending">
                  <span className="flex items-center gap-2">
                    Richieste
                    {pendingRequests.length > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
                        {pendingRequests.length}
                      </Badge>
                    )}
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="availability" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Fasce orarie settimanali</CardTitle>
                    <CardDescription>
                      Definisci quando sei disponibile per le prenotazioni
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AvailabilityEditor />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ooo" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Periodi di assenza</CardTitle>
                    <CardDescription>
                      Blocca date specifiche per ferie o altri impegni
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OutOfOfficeManager />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pending" className="space-y-3 mt-4">
                {pendingRequests.length === 0 ? (
                  <Card>
                    <CardContent className="pt-10 pb-10 text-center">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Nessuna richiesta in attesa</p>
                    </CardContent>
                  </Card>
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
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Request Detail Drawer */}
      <BookingRequestDrawer
        open={requestDrawerOpen}
        onOpenChange={setRequestDrawerOpen}
        request={selectedRequest}
      />
    </>
  );
}
