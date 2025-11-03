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
import { ArrowLeft, Edit, Plus, X } from "lucide-react";
import { toSentenceCase } from "@/lib/text";
import { toast } from "sonner";
import type { ClientStatus } from "@/types/client";
import { useClientPlansQuery } from "@/features/client-plans/hooks/useClientPlansQuery";
import { useUpdateClientPlan } from "@/features/client-plans/hooks/useUpdateClientPlan";
import { AssignPlanDialog } from "@/features/client-plans/components/AssignPlanDialog";
import { ClientPlanCard } from "@/features/client-plans/components/ClientPlanCard";
import { ClientAppointmentsTab } from "@/features/clients/components/ClientAppointmentsTab";
import { SessionHistoryTab } from "@/features/sessions/components/SessionHistoryTab";
import { PackageTab } from "@/features/packages/components/PackageTab";

const getStatusColor = (status: ClientStatus) => {
  switch (status) {
    case "ATTIVO":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    case "POTENZIALE":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    case "INATTIVO":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
    case "ARCHIVIATO":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

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
          <Button onClick={() => navigate("/clients")}>{toSentenceCase("Torna ai clienti")}</Button>
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <PageHeading>
                {currentClient.last_name} {currentClient.first_name}
              </PageHeading>
              <Badge className={`mt-1 ${getStatusColor(currentClient.status)}`} variant="secondary">
                {currentClient.status}
              </Badge>
            </div>
          </div>
          <Button onClick={() => setEditMode(!editMode)} variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            {editMode ? toSentenceCase("Annulla") : toSentenceCase("Modifica")}
          </Button>
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
            <TabsTrigger value="packages">📦 Pacchetti</TabsTrigger>
            <TabsTrigger value="appointments">{toSentenceCase("Appuntamenti")}</TabsTrigger>
            <TabsTrigger value="sessions">{toSentenceCase("Sessioni")}</TabsTrigger>
            <TabsTrigger value="measurements">{toSentenceCase("Misurazioni")}</TabsTrigger>
            <TabsTrigger value="activity">{toSentenceCase("Attività")}</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{toSentenceCase("Informazioni personali")}</CardTitle>
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
                  <div className="space-y-2">
                    <Label>{toSentenceCase("Stato")}</Label>
                    <p className="text-sm">{currentClient.status}</p>
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
            <div className="flex justify-between items-center mb-4">
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
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">{toSentenceCase("Nessun piano assegnato")}</p>
                  <Button onClick={() => setAssignDialogOpen(true)} className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    {toSentenceCase("Assegna piano")}
                  </Button>
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
            <SessionHistoryTab clientId={id!} />
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
