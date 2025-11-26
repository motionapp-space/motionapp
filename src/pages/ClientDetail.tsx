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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit, Plus, X, FileText, Play, Pencil, Activity } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { toSentenceCase } from "@/lib/text";
import { toast } from "sonner";
import { useClientPlansQuery } from "@/features/client-plans/hooks/useClientPlansQuery";
import { useUpdateClientPlan } from "@/features/client-plans/hooks/useUpdateClientPlan";
import { useToggleInUse } from "@/features/client-plans/hooks/useToggleInUse";
import { useDuplicatePlan } from "@/features/client-plans/hooks/useDuplicatePlan";
import { useSaveAsTemplate } from "@/features/client-plans/hooks/useSaveAsTemplate";
import { ClientPlansTab } from "@/features/client-plans/components/ClientPlansTab";
import { ClientAppointmentsTab } from "@/features/clients/components/ClientAppointmentsTab";
import { SessionHistoryTab } from "@/features/sessions/components/SessionHistoryTab";
import { PackageTab } from "@/features/packages/components/PackageTab";
import { DayPicker } from "@/features/sessions/components/DayPicker";
import { useCreateEvent } from "@/features/events/hooks/useCreateEvent";
import { useCreateSession } from "@/features/sessions/hooks/useCreateSession";
import { ClientActivityDialog } from "@/features/clients/components/ClientActivityDialog";
import { useClientOnboardingState } from "@/features/clients/hooks/useClientOnboardingState";
import { NextStepsPanel } from "@/features/clients/components/NextStepsPanel";

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
  const [quickSessionDayPickerOpen, setQuickSessionDayPickerOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [saveAsTemplateDialogOpen, setSaveAsTemplateDialogOpen] = useState(false);
  const [selectedPlanForTemplate, setSelectedPlanForTemplate] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
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
  const toggleInUseMutation = useToggleInUse();
  const duplicatePlanMutation = useDuplicatePlan();
  const saveAsTemplateMutation = useSaveAsTemplate();
  const createEvent = useCreateEvent();
  const createSession = useCreateSession();
  const onboardingState = useClientOnboardingState(id || "");

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

  const handleToggleInUse = (planId: string, currentValue: boolean) => {
    if (!id) return;
    toggleInUseMutation.mutate({ planId, clientId: id, currentValue });
  };

  const handleDuplicatePlan = (planId: string) => {
    duplicatePlanMutation.mutate({ planId });
  };

  const handleCompletePlan = async (planId: string) => {
    try {
      await updatePlanMutation.mutateAsync({ id: planId, updates: { status: "COMPLETATO", completed_at: new Date().toISOString() } });
      toast.success("Piano completato", {
        description: "Vuoi archiviare questo piano?",
        action: {
          label: "Archivia",
          onClick: () => handleArchivePlan(planId)
        }
      });
    } catch (error) {
      toast.error("Errore");
    }
  };

  const handleArchivePlan = async (planId: string) => {
    try {
      await updatePlanMutation.mutateAsync({ id: planId, updates: { status: "ELIMINATO", deleted_at: new Date().toISOString() } });
      toast.success("Piano archiviato");
    } catch (error) {
      toast.error("Errore");
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await updatePlanMutation.mutateAsync({ id: planId, updates: { status: "ELIMINATO", deleted_at: new Date().toISOString() } });
      toast.success("Piano eliminato");
    } catch (error) {
      toast.error("Errore");
    }
  };

  const handleToggleVisibility = async (planId: string, currentValue: boolean) => {
    try {
      await updatePlanMutation.mutateAsync({ id: planId, updates: { is_visible: !currentValue } });
      toast.success(currentValue ? "Piano nascosto" : "Piano visibile");
    } catch (error) {
      toast.error("Errore");
    }
  };

  const handleSaveAsTemplate = (planId: string) => {
    setSelectedPlanForTemplate(planId);
    setTemplateName("");
    setTemplateDescription("");
    setSaveAsTemplateDialogOpen(true);
  };

  const confirmSaveAsTemplate = async () => {
    if (!selectedPlanForTemplate) return;
    try {
      await saveAsTemplateMutation.mutateAsync({
        planId: selectedPlanForTemplate,
        input: {
          name: templateName,
          description: templateDescription,
          also_assign: false,
        },
      });
      toast.success("Template creato");
      setSaveAsTemplateDialogOpen(false);
    } catch (error) {
      toast.error("Errore");
    }
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
              {currentClient.first_name} {currentClient.last_name}
            </PageHeading>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-6xl">
        {/* Next Steps Panel - mostrato solo se il cliente non ha piani né appuntamenti */}
        {!onboardingState.isLoading && onboardingState.needsOnboarding && (
          <NextStepsPanel
            clientName={currentClient.first_name}
            onCreatePlan={() => {
              const sp = new URLSearchParams(searchParams);
              sp.set("tab", "plans");
              setSearchParams(sp, { replace: true });
            }}
            onCreateAppointment={() => {
              const sp = new URLSearchParams(searchParams);
              sp.set("tab", "appointments");
              setSearchParams(sp, { replace: true });
            }}
          />
        )}

        <Tabs
          value={searchParams.get("tab") || "profile"}
          onValueChange={(value) => {
            const sp = new URLSearchParams(searchParams);
            sp.set("tab", value);
            setSearchParams(sp, { replace: true });
          }}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">{toSentenceCase("Profilo")}</TabsTrigger>
            <TabsTrigger value="plans">{toSentenceCase("Piani")}</TabsTrigger>
            <TabsTrigger value="appointments">{toSentenceCase("Appuntamenti")}</TabsTrigger>
            <TabsTrigger value="sessions">{toSentenceCase("Sessioni")}</TabsTrigger>
            <TabsTrigger value="packages">{toSentenceCase("Pacchetti")}</TabsTrigger>
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

            {/* Box Misurazioni */}
            <Card>
              <CardHeader>
                <CardTitle>{toSentenceCase("Misurazioni")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {toSentenceCase("Funzionalità in sviluppo")}
                </p>
              </CardContent>
            </Card>

            {/* Bottone Dettaglio Attività */}
            <Card>
              <CardHeader>
                <CardTitle>{toSentenceCase("Cronologia modifiche")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => setActivityDialogOpen(true)}
                >
                  <Activity className="h-4 w-4" />
                  {toSentenceCase("Visualizza cronologia")}
                </Button>
                {currentClient.activities && currentClient.activities.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {currentClient.activities.length} {currentClient.activities.length === 1 ? "attività" : "attività"}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans">
            <ClientPlansTab
              clientId={id!}
              plans={clientPlans}
              isLoading={plansLoading}
              onDuplicate={handleDuplicatePlan}
              onToggleInUse={handleToggleInUse}
              onComplete={handleCompletePlan}
              onArchive={handleArchivePlan}
              onDelete={handleDeletePlan}
              onToggleVisibility={handleToggleVisibility}
              onSaveAsTemplate={handleSaveAsTemplate}
            />
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <ClientAppointmentsTab clientId={id!} />
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

          {/* Packages Tab */}
          <TabsContent value="packages">
            <PackageTab clientId={id!} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Activity Dialog */}
      <ClientActivityDialog
        open={activityDialogOpen}
        onOpenChange={setActivityDialogOpen}
        activities={currentClient.activities}
      />

      {/* Save As Template Dialog */}
      <Dialog open={saveAsTemplateDialogOpen} onOpenChange={setSaveAsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{toSentenceCase("Salva come template")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{toSentenceCase("Nome template")}</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder={toSentenceCase("Es: Piano Forza Base")}
              />
            </div>
            <div className="space-y-2">
              <Label>{toSentenceCase("Descrizione")}</Label>
              <Textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder={toSentenceCase("Descrizione del template...")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveAsTemplateDialogOpen(false)}>
              {toSentenceCase("Annulla")}
            </Button>
            <Button onClick={confirmSaveAsTemplate} disabled={!templateName.trim()}>
              {toSentenceCase("Crea template")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDetail;
