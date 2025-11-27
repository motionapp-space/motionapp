import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useTopbar } from "@/contexts/TopbarContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Download,
  CheckCircle,
  Loader2,
  Save,
  FileText,
  MoreVertical,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Star,
} from "lucide-react";
import { DayCardCompact } from "@/components/plan-editor/DayCardCompact";
import { DayPicker } from "@/features/sessions/components/DayPicker";
import { useCreateSession } from "@/features/sessions/hooks/useCreateSession";
import { exportPlanToPDF } from "@/lib/pdfExport";
import { toSentenceCase } from "@/lib/text";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { getClientPlan } from "@/features/client-plans/api/client-plans.api";
import { useUpdateClientPlan } from "@/features/client-plans/hooks/useUpdateClientPlan";
import { useSaveAsTemplate } from "@/features/client-plans/hooks/useSaveAsTemplate";
import { useAssignTemplate } from "@/features/client-plans/hooks/useAssignTemplate";
import { useCreateClientPlan } from "@/features/client-plans/hooks/useCreateClientPlan";
import { useTemplate } from "@/features/templates/hooks/useTemplate";
import type { ClientPlan } from "@/types/template";
import {
  makeDay,
  makeGroup,
  type Day,
  type PhaseType,
  type GroupType,
  type Exercise,
  type ExerciseGroup,
  migratePhaseToGroups,
} from "@/types/plan";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const ClientPlanEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<ClientPlan | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [nameError, setNameError] = useState(false);
  const [saveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [alsoAssign, setAlsoAssign] = useState(false);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);

  const updateMutation = useUpdateClientPlan();
  const saveAsTemplateMutation = useSaveAsTemplate();
  const assignMutation = useAssignTemplate();
  const createPlanMutation = useCreateClientPlan();
  const createSession = useCreateSession();

  const clientId = searchParams.get("clientId");
  const templateId = searchParams.get("templateId");
  const template = location.state?.template;
  const isNewFromTemplate = !id && templateId && template;

  const { data: derivedTemplate } = useTemplate(plan?.derived_from_template_id || undefined);

  // Set topbar (must be before any early returns)
  useTopbar({
    title: name || "Nuovo piano",
    showBack: true,
    onBack: () => {
      const targetClientId = plan?.client_id || clientId;
      if (targetClientId) {
        navigate(`/clients/${targetClientId}?tab=plans`);
      } else {
        navigate("/");
      }
    },
  });

  // Migrate days to use groups on load
  useEffect(() => {
    if (id) {
      loadClientPlan(id);
    } else if (isNewFromTemplate) {
      // New plan from template (personalize flow)
      setName(template.name);
      setDescription(template.description || "");
      // Migrate template data
      const migratedDays = (template.data?.days || []).map((day: Day) => ({
        ...day,
        phases: day.phases.map(migratePhaseToGroups),
      }));
      setDays(migratedDays);
      setLoading(false);
    } else {
      // New plan from scratch
      setName("");
      setDescription("");
      setDays([]);
      setLoading(false);
    }
  }, [id, isNewFromTemplate]);

  const loadClientPlan = async (planId: string) => {
    try {
      const data = await getClientPlan(planId);
      setPlan(data);
      setName(data.name);
      setDescription(data.description || "");
      setObjective(data.objective || "");
      // Migrate loaded data
      const migratedDays = (data.data?.days || []).map((day: Day) => ({
        ...day,
        phases: day.phases.map(migratePhaseToGroups),
      }));
      setDays(migratedDays);
    } catch (error) {
      toast.error("Errore nel caricamento del piano");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (id) {
      // Update existing client plan
      try {
        await updateMutation.mutateAsync({
          id,
          updates: {
            name,
            description,
            objective: objective || null,
            data: { days },
          },
        });
        toast.success("Piano salvato");
      } catch (error) {
        toast.error("Errore nel salvataggio");
      }
    } else if (isNewFromTemplate && clientId && templateId) {
      // Save new personalized plan for client
      try {
        await assignMutation.mutateAsync({
          clientId,
          input: {
            template_id: templateId,
            personalize: true,
            name_override: name,
            description,
            data_override: { days },
          },
        });
        toast.success("Piano assegnato");
        const sp = new URLSearchParams();
        sp.set("tab", "plans");
        navigate(`/clients/${clientId}?${sp.toString()}`, { replace: true });
      } catch (error) {
        toast.error("Errore nell'assegnazione");
      }
    } else if (clientId) {
      // Create new plan from scratch
      // Validazione nome
      if (!name || name.trim().length === 0) {
        setNameError(true);
        toast.error("Inserisci un nome per il piano");
        return;
      }

      try {
        await createPlanMutation.mutateAsync({
          clientId,
          name: name.trim(),
          description: description?.trim(),
          objective: objective?.trim() || null,
          days,
        });
        toast.success("Piano creato");
        const sp = new URLSearchParams();
        sp.set("tab", "plans");
        navigate(`/clients/${clientId}?${sp.toString()}`, { replace: true });
      } catch (error) {
        console.error("Error creating plan:", error);
      }
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!id) return;

    try {
      await saveAsTemplateMutation.mutateAsync({
        planId: id,
        input: {
          name: templateName,
          description: templateDescription,
          also_assign: alsoAssign,
        },
      });
      toast.success("Template creato");
      setSaveAsTemplateOpen(false);
    } catch (error) {
      toast.error("Errore nella creazione del template");
    }
  };

  const handleExportPDF = () => {
    if (plan || isNewFromTemplate) {
      exportPlanToPDF({
        name,
        days,
        created_at: plan?.created_at,
        updated_at: plan?.updated_at,
      });
    }
  };

  const handleAddDay = () => {
    const newDay = makeDay(days.length + 1);
    setDays([...days, newDay]);
  };

  const handleUpdateDayTitle = (dayId: string, title: string) => {
    setDays(days.map((d) => (d.id === dayId ? { ...d, title } : d)));
  };

  const handleDuplicateDay = (dayId: string) => {
    const dayToDup = days.find((d) => d.id === dayId);
    if (!dayToDup) return;
    const newDay = { ...dayToDup, id: crypto.randomUUID(), order: days.length + 1 };
    setDays([...days, newDay]);
  };

  const handleDeleteDay = (dayId: string) => {
    setDays(days.filter((d) => d.id !== dayId));
  };

  const handleAddGroup = (dayId: string, phaseType: PhaseType, groupType: GroupType) => {
    setDays(
      days.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            phases: day.phases.map((phase) => {
              if (phase.type === phaseType) {
                const migratedPhase = migratePhaseToGroups(phase);
                const newGroup = makeGroup(groupType, migratedPhase.groups.length + 1);
                return { ...phase, groups: [...migratedPhase.groups, newGroup] };
              }
              return phase;
            }),
          };
        }
        return day;
      }),
    );
  };

  const handleUpdateGroup = (dayId: string, phaseType: PhaseType, groupId: string, updates: Partial<ExerciseGroup>) => {
    setDays(
      days.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            phases: day.phases.map((phase) => {
              if (phase.type === phaseType) {
                const migratedPhase = migratePhaseToGroups(phase);
                return {
                  ...phase,
                  groups: migratedPhase.groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)),
                };
              }
              return phase;
            }),
          };
        }
        return day;
      }),
    );
  };

  const handleDuplicateGroup = (dayId: string, phaseType: PhaseType, groupId: string) => {
    setDays(
      days.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            phases: day.phases.map((phase) => {
              if (phase.type === phaseType) {
                const migratedPhase = migratePhaseToGroups(phase);
                const groupToDup = migratedPhase.groups.find((g) => g.id === groupId);
                if (!groupToDup) return phase;
                const newGroup = {
                  ...groupToDup,
                  id: crypto.randomUUID(),
                  exercises: groupToDup.exercises.map((ex) => ({ ...ex, id: crypto.randomUUID() })),
                  order: migratedPhase.groups.length + 1,
                };
                return { ...phase, groups: [...migratedPhase.groups, newGroup] };
              }
              return phase;
            }),
          };
        }
        return day;
      }),
    );
  };

  const handleDeleteGroup = (dayId: string, phaseType: PhaseType, groupId: string) => {
    setDays(
      days.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            phases: day.phases.map((phase) => {
              if (phase.type === phaseType) {
                const migratedPhase = migratePhaseToGroups(phase);
                return { ...phase, groups: migratedPhase.groups.filter((g) => g.id !== groupId) };
              }
              return phase;
            }),
          };
        }
        return day;
      }),
    );
  };

  const handleAddExerciseToGroup = (dayId: string, phaseType: PhaseType, groupId: string) => {
    setDays(
      days.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            phases: day.phases.map((phase) => {
              if (phase.type === phaseType) {
                const migratedPhase = migratePhaseToGroups(phase);
                return {
                  ...phase,
                  groups: migratedPhase.groups.map((group) => {
                    if (group.id === groupId) {
                      const newExercise = {
                        id: crypto.randomUUID(),
                        name: "",
                        sets: 3,
                        reps: "10",
                        load: "",
                        rest: "01:00",
                        notes: "",
                        order: group.exercises.length + 1,
                      };
                      return { ...group, exercises: [...group.exercises, newExercise] };
                    }
                    return group;
                  }),
                };
              }
              return phase;
            }),
          };
        }
        return day;
      }),
    );
  };

  const handleUpdateExercise = (
    dayId: string,
    phaseType: PhaseType,
    groupId: string,
    exerciseId: string,
    updates: Partial<Exercise>,
  ) => {
    setDays(
      days.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            phases: day.phases.map((phase) => {
              if (phase.type === phaseType) {
                const migratedPhase = migratePhaseToGroups(phase);
                return {
                  ...phase,
                  groups: migratedPhase.groups.map((group) => {
                    if (group.id === groupId) {
                      return {
                        ...group,
                        exercises: group.exercises.map((ex) => (ex.id === exerciseId ? { ...ex, ...updates } : ex)),
                      };
                    }
                    return group;
                  }),
                };
              }
              return phase;
            }),
          };
        }
        return day;
      }),
    );
  };

  const handleDuplicateExercise = (dayId: string, phaseType: PhaseType, groupId: string, exerciseId: string) => {
    setDays(
      days.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            phases: day.phases.map((phase) => {
              if (phase.type === phaseType) {
                const migratedPhase = migratePhaseToGroups(phase);
                return {
                  ...phase,
                  groups: migratedPhase.groups.map((group) => {
                    if (group.id === groupId) {
                      const exToDup = group.exercises.find((ex) => ex.id === exerciseId);
                      if (!exToDup) return group;
                      const newEx = { ...exToDup, id: crypto.randomUUID(), order: group.exercises.length + 1 };
                      return { ...group, exercises: [...group.exercises, newEx] };
                    }
                    return group;
                  }),
                };
              }
              return phase;
            }),
          };
        }
        return day;
      }),
    );
  };

  const handleDeleteExercise = (dayId: string, phaseType: PhaseType, groupId: string, exerciseId: string) => {
    setDays(
      days.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            phases: day.phases.map((phase) => {
              if (phase.type === phaseType) {
                const migratedPhase = migratePhaseToGroups(phase);
                return {
                  ...phase,
                  groups: migratedPhase.groups.map((group) => {
                    if (group.id === groupId) {
                      return { ...group, exercises: group.exercises.filter((ex) => ex.id !== exerciseId) };
                    }
                    return group;
                  }),
                };
              }
              return phase;
            }),
          };
        }
        return day;
      }),
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const clientName = plan?.client_id ? "Cliente" : "Cliente";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-6xl">
        {/* Action toolbar */}
        <div className="flex items-center justify-end gap-2 mb-6">
          {(id || isNewFromTemplate) && (
            <Button onClick={handleExportPDF} variant="outline" size="sm">
              <Download className="h-4 w-4" />
              PDF
            </Button>
          )}
          <Button onClick={handleSave} size="sm">
            <Save className="h-4 w-4" />
            {id ? "Salva" : "Assegna piano"}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const targetClientId = plan?.client_id || clientId;
              if (targetClientId) {
                navigate(`/clients/${targetClientId}?tab=plans`);
              } else {
                navigate("/");
              }
            }}
          >
            Annulla
          </Button>
        </div>

        {isNewFromTemplate && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm mb-6">
            <p className="text-blue-900 dark:text-blue-100">
              {toSentenceCase("Stai personalizzando un piano basato sul template")} "{template.name}".{" "}
              {toSentenceCase("Le modifiche non influiscono sul template originale")}.
            </p>
          </div>
        )}
        {id && !isNewFromTemplate && plan?.derived_from_template_id && derivedTemplate && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm mb-6">
            <p className="text-blue-900 dark:text-blue-100">
              {toSentenceCase("Questo piano è stato creato a partire dal template")} "{derivedTemplate.name}".{" "}
              {toSentenceCase("Le modifiche non influiscono sul template originale")}.
            </p>
          </div>
        )}

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label>
                {toSentenceCase("Nome piano")}
                {!id && <span className="ml-1">*</span>}
              </Label>
              <div className="space-y-1">
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError(false);
                  }}
                  placeholder="Es: Piano Forza Personalizzato"
                  className={nameError ? "border-destructive" : ""}
                />
                {nameError && <p className="text-sm text-destructive">Il nome del piano è obbligatorio</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{toSentenceCase("Tipo piano")}</Label>
              <Input
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Es: Forza, Ipertrofia..."
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label>{toSentenceCase("Descrizione")}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Note specifiche per questo cliente..."
                rows={1}
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{toSentenceCase("Giorni di allenamento")}</h2>
              <Button onClick={handleAddDay} variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                {toSentenceCase("Aggiungi giorno")}
              </Button>
            </div>

            {days.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground mb-4">{toSentenceCase("Nessun giorno ancora")}</p>
                <Button onClick={handleAddDay} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {toSentenceCase("Aggiungi primo giorno")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {days.map((day) => (
                  <DayCardCompact
                    key={day.id}
                    day={day}
                    onUpdateTitle={(title) => handleUpdateDayTitle(day.id, title)}
                    onDuplicate={() => handleDuplicateDay(day.id)}
                    onDelete={() => handleDeleteDay(day.id)}
                    onAddGroup={(phaseType, groupType) => handleAddGroup(day.id, phaseType, groupType)}
                    onUpdateGroup={(phaseType, groupId, updates) =>
                      handleUpdateGroup(day.id, phaseType, groupId, updates)
                    }
                    onDuplicateGroup={(phaseType, groupId) => handleDuplicateGroup(day.id, phaseType, groupId)}
                    onDeleteGroup={(phaseType, groupId) => handleDeleteGroup(day.id, phaseType, groupId)}
                    onAddExerciseToGroup={(phaseType, groupId) => handleAddExerciseToGroup(day.id, phaseType, groupId)}
                    onUpdateExercise={(phaseType, groupId, exerciseId, patch) =>
                      handleUpdateExercise(day.id, phaseType, groupId, exerciseId, patch)
                    }
                    onDuplicateExercise={(phaseType, groupId, exerciseId) =>
                      handleDuplicateExercise(day.id, phaseType, groupId, exerciseId)
                    }
                    onDeleteExercise={(phaseType, groupId, exerciseId) =>
                      handleDeleteExercise(day.id, phaseType, groupId, exerciseId)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save as Template Dialog */}
      <Dialog open={saveAsTemplateOpen} onOpenChange={setSaveAsTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{toSentenceCase("Salva come template")}</DialogTitle>
            <DialogDescription>
              {toSentenceCase("Crea un nuovo template riutilizzabile da questo piano")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{toSentenceCase("Nome template")}</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Es: Piano Forza Avanzato"
              />
            </div>
            <div className="space-y-2">
              <Label>{toSentenceCase("Descrizione")}</Label>
              <Textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Descrizione del template..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveAsTemplateOpen(false)}>
              {toSentenceCase("Annulla")}
            </Button>
            <Button onClick={handleSaveAsTemplate} disabled={!templateName.trim()}>
              {toSentenceCase("Crea template")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Day Picker for Session */}
      {id && clientId && (
        <DayPicker
          open={dayPickerOpen}
          onOpenChange={setDayPickerOpen}
          clientId={clientId}
          onConfirm={async (planId, dayId) => {
            const session = await createSession.mutateAsync({
              client_id: clientId,
              plan_id: planId,
              day_id: dayId,
            });
            navigate(`/session/live?sessionId=${session.id}`);
          }}
        />
      )}
    </div>
  );
};

export default ClientPlanEditor;
