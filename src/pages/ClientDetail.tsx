import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useClientStore } from "@/stores/useClientStore";
import { PageHeading } from "@/components/ui/page-heading";
import { usePlanStore } from "@/stores/usePlanStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit, Plus, X, ExternalLink } from "lucide-react";
import { toSentenceCase } from "@/lib/text";
import { toast } from "sonner";
import type { ClientStatus, PlanStatus } from "@/types/client";

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
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    status: "POTENZIALE" as ClientStatus,
    notes: "",
  });

  const { plans, loadPlans } = usePlanStore();

  useEffect(() => {
    if (id) {
      loadClient(id);
      loadPlans();
    }
  }, [id, loadClient]);

  useEffect(() => {
    if (currentClient) {
      setFormData({
        first_name: currentClient.first_name,
        last_name: currentClient.last_name,
        email: currentClient.email || "",
        phone: currentClient.phone || "",
        status: currentClient.status,
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

  const handleAssignPlan = async () => {
    if (!id || !selectedPlanId) {
      toast.error("Seleziona un piano");
      return;
    }
    await assignPlan(id, selectedPlanId, assignNote);
    setAssignDialogOpen(false);
    setSelectedPlanId("");
    setAssignNote("");
    // Mantieni la tab "plans" attiva dopo l'assegnazione
    const sp = new URLSearchParams(searchParams);
    sp.set("tab", "plans");
    setSearchParams(sp, { replace: true });
  };

  const handleUpdateAssignmentStatus = async (assignmentId: string, status: PlanStatus) => {
    await updateAssignment(assignmentId, status);
    if (id) await loadClient(id);
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

  const activePlans = currentClient.assignments?.filter((a) => a.status === "ATTIVA") || [];
  const pastPlans = currentClient.assignments?.filter((a) => a.status !== "ATTIVA") || [];

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
              <Badge className="mt-1">{currentClient.status}</Badge>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">{toSentenceCase("Profilo")}</TabsTrigger>
            <TabsTrigger value="plans">{toSentenceCase("Piani")}</TabsTrigger>
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
                    <Label>{toSentenceCase("Stato")}</Label>
                    {editMode ? (
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value as ClientStatus })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="POTENZIALE">Potenziale</SelectItem>
                          <SelectItem value="ATTIVO">Attivo</SelectItem>
                          <SelectItem value="SOSPESO">Sospeso</SelectItem>
                          <SelectItem value="ARCHIVIATO">Archiviato</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{currentClient.status}</p>
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{toSentenceCase("Piani attivi")}</CardTitle>
                <Button onClick={() => setAssignDialogOpen(true)} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {toSentenceCase("Assegna piano")}
                </Button>
              </CardHeader>
              <CardContent>
                {activePlans.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{toSentenceCase("Nessun piano attivo")}</p>
                ) : (
                  <div className="space-y-3">
                    {activePlans.map((assignment) => (
                      <div key={assignment.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{assignment.plan?.name}</h4>
                            <p className="text-sm text-muted-foreground">{assignment.plan?.goal}</p>
                            {assignment.note && (
                              <p className="text-sm text-muted-foreground mt-1">{assignment.note}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/plans/${assignment.plan_id}/edit`)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Select
                              value={assignment.status}
                              onValueChange={(value) => handleUpdateAssignmentStatus(assignment.id, value as PlanStatus)}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ATTIVA">Attiva</SelectItem>
                                <SelectItem value="COMPLETATA">Completata</SelectItem>
                                <SelectItem value="SCADUTA">Scaduta</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {pastPlans.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{toSentenceCase("Storico piani")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pastPlans.map((assignment) => (
                      <div key={assignment.id} className="border rounded-lg p-4 opacity-60">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{assignment.plan?.name}</h4>
                            <p className="text-sm text-muted-foreground">{assignment.plan?.goal}</p>
                          </div>
                          <Badge variant="secondary">{assignment.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Measurements Tab */}
          <TabsContent value="measurements">
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
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{toSentenceCase("Assegna piano")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{toSentenceCase("Piano")}</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder={toSentenceCase("Seleziona un piano...")} />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({plan.objective})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{toSentenceCase("Note")}</Label>
              <Textarea
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
                placeholder={toSentenceCase("Note aggiuntive...")}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              {toSentenceCase("Annulla")}
            </Button>
            <Button onClick={handleAssignPlan}>{toSentenceCase("Assegna")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDetail;
