import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useClientStore } from "@/stores/useClientStore";
import { PageHeading } from "@/components/ui/page-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit, Plus, X, FileText, Play, Pencil } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { toSentenceCase } from "@/lib/text";
import { toast } from "sonner";
import { useClientPlansQuery } from "@/features/client-plans/hooks/useClientPlansQuery";
import { useUpdateClientPlan } from "@/features/client-plans/hooks/useUpdateClientPlan";
import { AssignPlanDialog } from "@/features/client-plans/components/AssignPlanDialog";
import { ClientPlanCard } from "@/features/client-plans/components/ClientPlanCard";
import { ClientAppointmentsTab } from "@/features/clients/components/ClientAppointmentsTab";
import { SessionHistoryTab } from "@/features/sessions/components/SessionHistoryTab";
import { PackageTab } from "@/features/packages/components/PackageTab";
import { DayPicker } from "@/features/sessions/components/DayPicker";
import { useCreateEvent } from "@/features/events/hooks/useCreateEvent";
import { useCreateSession } from "@/features/sessions/hooks/useCreateSession";

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    currentClient,
    isLoading,
    isSaving,
    loadClient,
    updateClient,
    addTagToClient,
    removeTagFromClient,
    assignPlan,
    updateAssignment,
  } = useClientStore();

  const [editMode, setEditMode] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [quickSessionDayPickerOpen, setQuickSessionDayPickerOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    fiscal_code: "",
    notes: "",
  });

  const { data: clientPlans = [], isLoading: plansLoading } = useClientPlansQuery(id || "");
  const updatePlanMutation = useUpdateClientPlan();
  const createEvent = useCreateEvent();
  const createSession = useCreateSession();

  useEffect(() => {
    if (id) {
      loadClient(id);
    }
  }, [id, loadClient]);

  useEffect(() => {
    if (currentClient) {
      setFormData({
        first_name: currentClient.first_name,
        last_name: currentClient.last_name,
        email: currentClient.email || "",
        phone: currentClient.phone || "",
        fiscal_code: currentClient.fiscal_code || "",
        notes: currentClient.notes || "",
      });
    }
  }, [currentClient]);

  const handleSave = async () => {
    if (!id) return;
    await updateClient(id, formData);
    setEditMode(false);
  };

  const handleAddTag = async () => {
    if (!id || !tagInput.trim()) return;
    await addTagToClient(id, tagInput.trim());
    setTagInput("");
  };

  const handleUpdatePlanStatus = async (planId: string, status: "IN_CORSO" | "COMPLETATO" | "ELIMINATO") => {
    try {
      await updatePlanMutation.mutateAsync({ id: planId, updates: { status } });
      toast.success("Stato aggiornato");
    } catch (error) {
      toast.error("Errore nell'aggiornamento");
    }
  };

  const handleQuickSessionStart = () => {
    setQuickSessionDayPickerOpen(true);
  };

  const handleQuickSessionConfirm = async (planId: string, dayId: string) => {
    if (!id) return;
    
    try {
      // 1. Create event "NOW" - this will scale packages
      const now = new Date();
      const endTime = new Date(now.getTime() + 60 * 60 * 1000); // +1h default
      
      const event = await createEvent.mutateAsync({
        client_id: id,
        title: "Sessione live",
        start_at: now.toISOString(),
        end_at: endTime.toISOString(),
        linked_plan_id: planId,
        linked_day_id: dayId,
        session_status: "scheduled",
        source: "manual",
      });
      
      // 2. Create session linked to event
      const session = await createSession.mutateAsync({
        client_id: id,
        plan_id: planId,
        day_id: dayId,
        event_id: event.id,
        source: "with_coach",
      });
      
      // 3. Navigate to LiveSession
      navigate(`/session/live?sessionId=${session.id}`);
      
    } catch (error) {
      toast.error("Errore", {
        description: "Impossibile avviare la sessione. Riprova.",
      });
    } finally {
      setQuickSessionDayPickerOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!currentClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{toSentenceCase("Cliente non trovato")}</p>
          <Button onClick={() => navigate("/")}>{toSentenceCase("Torna ai clienti")}</Button>
        </div>
      </div>
    );
  }

  // Plans are now loaded via useClientPlansQuery hook

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <PageHeading>
              {currentClient.last_name} {currentClient.first_name}
            </PageHeading>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-6xl">
        <Tabs
          value={searchParams.get("tab") || "profile"}
          onValueChange={(value) => {
            const sp = new URLSearchParams(searchParams);
            sp.set("tab", value);
            setSearchParams(sp, { replace: true });
          }}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="profile">{toSentenceCase("Profilo")}</TabsTrigger>
            <TabsTrigger value="plans">{toSentenceCase("Piani")}</TabsTrigger>
            <TabsTrigger value="packages">{toSentenceCase("Pacchetti")}</TabsTrigger>
            <TabsTrigger value="appointments">{toSentenceCase("Appuntamenti")}</TabsTrigger>
            <TabsTrigger value="sessions">{toSentenceCase("Sessioni")}</TabsTrigger>
            <TabsTrigger value="measurements">{toSentenceCase("Misurazioni")}</TabsTrigger>
            <TabsTrigger value="activity">{toSentenceCase("Attività")}</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>{toSentenceCase("Informazioni personali")}</CardTitle>
                {!editMode && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditMode(true)}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">{toSentenceCase("Modifica informazioni personali")}</span>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{toSentenceCase("Nome")}</Label>
                    {editMode ? (
                      <Input
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{currentClient.first_name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{toSentenceCase("Cognome")}</Label>
                    {editMode ? (
                      <Input
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{currentClient.last_name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{toSentenceCase("Email")}</Label>
                    {editMode ? (
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{currentClient.email || "-"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{toSentenceCase("Telefono")}</Label>
                    {editMode ? (
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{currentClient.phone || "-"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{toSentenceCase("Codice Fiscale")}</Label>
                    {editMode ? (
                      <Input
                        value={formData.fiscal_code}
                        onChange={(e) => setFormData({ ...formData, fiscal_code: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{currentClient.fiscal_code || "-"}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{toSentenceCase("Note")}</Label>
                  {editMode ? (
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{currentClient.notes || "-"}</p>
                  )}
                </div>
                {editMode && (
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setEditMode(false)}>
                      {toSentenceCase("Annulla")}
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {toSentenceCase("Salva modifiche")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{toSentenceCase("Tags")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {currentClient.tags?.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="gap-2">
                      {tag.label}
                      <button
                        onClick={() => removeTagFromClient(currentClient.id, tag.id)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder={toSentenceCase("Nuovo tag...")}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  />
                  <Button onClick={handleAddTag} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{toSentenceCase("Piani assegnati")}</h3>
              <Button onClick={() => setAssignDialogOpen(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                {toSentenceCase("Assegna piano")}
              </Button>
            </div>

            {plansLoading ? (
              <div className="text-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              </div>
            ) : clientPlans.length === 0 ? (
              <Card>
                <CardContent className="p-0">
                  <EmptyState
                    icon={FileText}
                    title="Nessun piano assegnato"
                    description="Questo cliente non ha ancora piani di allenamento assegnati. Assegna un piano per iniziare."
                    action={{
                      label: "Assegna piano",
                      onClick: () => setAssignDialogOpen(true)
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {clientPlans
                  .filter((p) => p.status === "IN_CORSO")
                  .map((plan) => (
                    <ClientPlanCard
                      key={plan.id}
                      plan={plan}
                      onEdit={() => navigate(`/client-plans/${plan.id}/edit`)}
                      onUpdateStatus={(status) => handleUpdatePlanStatus(plan.id, status)}
                    />
                  ))}

                {clientPlans.filter((p) => p.status !== "IN_CORSO").length > 0 && (
                  <>
                    <h4 className="text-md font-semibold mt-4">{toSentenceCase("Storico")}</h4>
                    {clientPlans
                      .filter((p) => p.status !== "IN_CORSO")
                      .map((plan) => (
                        <ClientPlanCard
                          key={plan.id}
                          plan={plan}
                          onEdit={() => navigate(`/client-plans/${plan.id}/edit`)}
                          onUpdateStatus={(status) => handleUpdatePlanStatus(plan.id, status)}
                        />
                      ))}
                  </>
                )}
              </div>
            )}
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <ClientAppointmentsTab clientId={id!} />
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages">
            <PackageTab clientId={id!} />
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <SessionHistoryTab 
              clientId={id!} 
              onStartNewSession={handleQuickSessionStart}
            />
            <DayPicker
              open={quickSessionDayPickerOpen}
              onOpenChange={setQuickSessionDayPickerOpen}
              onConfirm={handleQuickSessionConfirm}
              clientId={id!}
            />
          </TabsContent>

          {/* Measurements Tab */}
          <TabsContent value="measurements">
            <Card>
              <CardHeader>
                <CardTitle>{toSentenceCase("Misurazioni")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{toSentenceCase("Funzionalità in sviluppo")}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>{toSentenceCase("Registro attività")}</CardTitle>
              </CardHeader>
              <CardContent>
                {currentClient.activities?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{toSentenceCase("Nessuna attività")}</p>
                ) : (
                  <div className="space-y-3">
                    {currentClient.activities?.map((activity) => (
                      <div key={activity.id} className="border-l-2 pl-4 py-2">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString("it-IT", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Assign Plan Dialog */}
      <AssignPlanDialog clientId={id || ""} open={assignDialogOpen} onOpenChange={setAssignDialogOpen} />
    </div>
  );
};

export default ClientDetail;
