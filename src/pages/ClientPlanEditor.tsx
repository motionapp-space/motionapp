import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Loader2,
  Plus,
  Info,
} from "lucide-react";
import { DayCardCompact } from "@/components/plan-editor/DayCardCompact";
import { DayPicker } from "@/features/sessions/components/DayPicker";
import { useCreateSession } from "@/features/sessions/hooks/useCreateSession";
import { exportPlanToPDF } from "@/lib/pdfExport";
import { toSentenceCase } from "@/lib/text";
import { toast } from "sonner";
import { getClientPlan } from "@/features/client-plans/api/client-plans.api";
import { useUpdateClientPlan } from "@/features/client-plans/hooks/useUpdateClientPlan";
import { useSaveAsTemplate } from "@/features/client-plans/hooks/useSaveAsTemplate";
import { useAssignTemplate } from "@/features/client-plans/hooks/useAssignTemplate";
import { useCreateClientPlan } from "@/features/client-plans/hooks/useCreateClientPlan";
import { useDeletePlanPermanent } from "@/features/client-plans/hooks/useDeletePlanPermanent";
import { useTemplate } from "@/features/templates/hooks/useTemplate";
import { getClientIdFromCoachClient, getCoachClientId } from "@/lib/coach-client";
import { PlanEditorSaveBar } from "@/features/plans/components/PlanEditorSaveBar";
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

const ClientPlanEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Always in edit mode (aligned to TemplateEditor)
  const readonly = false;
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<ClientPlan | null>(null);
  const [resolvedClientId, setResolvedClientId] = useState<string | null>(null);
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

  // New state for dirty tracking and dialogs
  const [initialStateSnapshot, setInitialStateSnapshot] = useState<string | null>(null);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveBeforeExportOpen, setSaveBeforeExportOpen] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const pendingNavigation = useRef<(() => void) | null>(null);

  const updateMutation = useUpdateClientPlan();
  const saveAsTemplateMutation = useSaveAsTemplate();
  const assignMutation = useAssignTemplate();
  const createPlanMutation = useCreateClientPlan();
  const createSession = useCreateSession();
  const deleteMutation = useDeletePlanPermanent();

  const clientId = searchParams.get("clientId");
  const templateId = searchParams.get("templateId");
  const template = location.state?.template;
  const isNewFromTemplate = !id && templateId && template;

  const { data: derivedTemplate } = useTemplate(plan?.derived_from_template_id || undefined);

  // Helper to create stable snapshot
  const createSnapshot = (n: string, d: string, o: string, daysData: Day[]) => {
    return JSON.stringify({ name: n, description: d, objective: o, days: daysData });
  };

  // Calculate hasChanges using snapshot string comparison
  const currentSnapshot = useMemo(
    () => createSnapshot(name, description, objective, days),
    [name, description, objective, days]
  );
  const hasChanges = initialStateSnapshot !== null && currentSnapshot !== initialStateSnapshot;

  const isSaving = updateMutation.isPending || assignMutation.isPending || createPlanMutation.isPending;
  // canSave: must have changes, not readonly, not saving, and name must be valid for new plans
  const isNameValid = id ? true : name.trim().length > 0;
  const canSave = hasChanges && !readonly && !isSaving && isNameValid;

  // Resolve client_id from coach_client_id when plan is loaded
  useEffect(() => {
    if (plan?.coach_client_id) {
      getClientIdFromCoachClient(plan.coach_client_id)
        .then(setResolvedClientId)
        .catch(console.error);
    }
  }, [plan?.coach_client_id]);

  // Default navigation function
  const defaultNavigate = useCallback(() => {
    const targetClientId = resolvedClientId || clientId;
    if (targetClientId) {
      navigate(`/clients/${targetClientId}?tab=plans`);
    } else {
      navigate("/");
    }
  }, [resolvedClientId, clientId, navigate]);

  // Exit request handler with dirty check
  const handleExitRequest = useCallback(
    (navigationFn?: () => void) => {
      if (hasChanges) {
        pendingNavigation.current = navigationFn || defaultNavigate;
        setExitDialogOpen(true);
      } else {
        (navigationFn || defaultNavigate)();
      }
    },
    [hasChanges, defaultNavigate]
  );

  // Set topbar (must be before any early returns)
  useTopbar({
    title: name || "Nuovo piano",
    showBack: true,
    onBack: () => handleExitRequest(),
  });

  // beforeunload browser guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

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
      // Set initial snapshot after state updates
      setTimeout(() => {
        setInitialStateSnapshot(
          createSnapshot(template.name, template.description || "", "", migratedDays)
        );
      }, 0);
    } else {
      // New plan from scratch
      setName("");
      setDescription("");
      setDays([]);
      setLoading(false);
      // Set initial snapshot for empty plan
      setTimeout(() => {
        setInitialStateSnapshot(createSnapshot("", "", "", []));
      }, 0);
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
      // Set initial snapshot after load
      setTimeout(() => {
        setInitialStateSnapshot(
          createSnapshot(data.name, data.description || "", data.objective || "", migratedDays)
        );
      }, 0);
    } catch (error) {
      toast.error("Errore nel caricamento del piano");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (): Promise<boolean> => {
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
        // Reset dirty tracking on success
        setInitialStateSnapshot(currentSnapshot);
        toast.success("Piano salvato");
        return true;
      } catch (error) {
        toast.error("Errore nel salvataggio");
        return false;
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
        return true;
      } catch (error) {
        toast.error("Errore nell'assegnazione");
        return false;
      }
    } else if (clientId) {
      // Create new plan from scratch
      if (!name || name.trim().length === 0) {
        setNameError(true);
        toast.error("Inserisci un nome per il piano");
        return false;
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
        return true;
      } catch (error) {
        console.error("Error creating plan:", error);
        return false;
      }
    }
    return false;
  };

  // Exit without save
  const handleExitWithoutSave = () => {
    setExitDialogOpen(false);
    pendingNavigation.current?.();
    pendingNavigation.current = null;
  };

  // Save and exit
  const handleSaveAndExit = async () => {
    const success = await handleSave();
    if (success) {
      setExitDialogOpen(false);
      pendingNavigation.current?.();
      pendingNavigation.current = null;
    }
    // If save fails, dialog stays open, user sees error toast
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

  // PDF export with gating for unsaved plans
  const handleExportPDF = async () => {
    // If plan has no id, show save first dialog
    if (!id) {
      setSaveBeforeExportOpen(true);
      return;
    }

    setIsExporting(true);
    try {
      exportPlanToPDF({
        name,
        days,
        created_at: plan?.created_at,
        updated_at: plan?.updated_at,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Save and export
  const handleSaveAndExport = async () => {
    const success = await handleSave();
    if (success) {
      setSaveBeforeExportOpen(false);
      // After save, we can export
      setIsExporting(true);
      try {
        exportPlanToPDF({ name, days });
      } finally {
        setIsExporting(false);
      }
    }
  };

  // Delete plan
  const handleDeletePlan = async () => {
    if (!id || !resolvedClientId) return;

    try {
      await deleteMutation.mutateAsync({ clientId: resolvedClientId, planId: id });
      setDeleteDialogOpen(false);
      navigate(`/clients/${resolvedClientId}?tab=plans`);
    } catch (error) {
      // Error handled by mutation
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
      })
    );
  };

  const handleUpdateGroup = (
    dayId: string,
    phaseType: PhaseType,
    groupId: string,
    updates: Partial<ExerciseGroup>
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
                  groups: migratedPhase.groups.map((g) =>
                    g.id === groupId ? { ...g, ...updates } : g
                  ),
                };
              }
              return phase;
            }),
          };
        }
        return day;
      })
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
                  exercises: groupToDup.exercises.map((ex) => ({
                    ...ex,
                    id: crypto.randomUUID(),
                  })),
                  order: migratedPhase.groups.length + 1,
                };
                return { ...phase, groups: [...migratedPhase.groups, newGroup] };
              }
              return phase;
            }),
          };
        }
        return day;
      })
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
                return {
                  ...phase,
                  groups: migratedPhase.groups.filter((g) => g.id !== groupId),
                };
              }
              return phase;
            }),
          };
        }
        return day;
      })
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
      })
    );
  };

  const handleUpdateExercise = (
    dayId: string,
    phaseType: PhaseType,
    groupId: string,
    exerciseId: string,
    updates: Partial<Exercise>
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
                        exercises: group.exercises.map((ex) =>
                          ex.id === exerciseId ? { ...ex, ...updates } : ex
                        ),
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
      })
    );
  };

  const handleDuplicateExercise = (
    dayId: string,
    phaseType: PhaseType,
    groupId: string,
    exerciseId: string
  ) => {
    setDays(
      days.map((day) => {
        if (day.id !== dayId) return day;

        return {
          ...day,
          phases: day.phases.map((phase) => {
            if (phase.type !== phaseType) return phase;

            const migratedPhase = migratePhaseToGroups(phase);
            const groupIndex = migratedPhase.groups.findIndex((g) => g.id === groupId);
            if (groupIndex === -1) return phase;

            const group = migratedPhase.groups[groupIndex];
            const exToDup = group.exercises.find((ex) => ex.id === exerciseId);
            if (!exToDup) return phase;

            // Create a NEW single group with the duplicated exercise
            const newGroup: ExerciseGroup = {
              id: crypto.randomUUID(),
              type: "single",
              exercises: [{ ...exToDup, id: crypto.randomUUID(), order: 1 }],
              order: group.order + 1,
            };

            // Insert new group after original and reorder subsequent groups
            const newGroups = [
              ...migratedPhase.groups.slice(0, groupIndex + 1),
              newGroup,
              ...migratedPhase.groups.slice(groupIndex + 1).map((g) => ({
                ...g,
                order: g.order + 1,
              })),
            ];

            return { ...phase, groups: newGroups };
          }),
        };
      })
    );
  };

  const handleDeleteExercise = (
    dayId: string,
    phaseType: PhaseType,
    groupId: string,
    exerciseId: string
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
                        exercises: group.exercises.filter((ex) => ex.id !== exerciseId),
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
      })
    );
  };

  // Calculate description rows for Notion-like auto-expand
  const descriptionRows = useMemo(() => {
    if (descriptionFocused) {
      // On focus: minimum 2, max 5, based on content
      const lines = description.split("\n").length;
      const charRows = Math.ceil(description.length / 80);
      return Math.min(Math.max(lines, charRows, 2), 5);
    }
    // Blur: 1 row if empty/short, otherwise min needed to see content (max 2)
    if (!description.trim()) return 1;
    return Math.min(Math.ceil(description.length / 80), 2);
  }, [description, descriptionFocused]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-6xl">
        {isNewFromTemplate && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm mb-6">
            <p className="text-blue-900 dark:text-blue-100">
              {toSentenceCase("Stai personalizzando un piano basato sul template")} "
              {template.name}".{" "}
              {toSentenceCase("Le modifiche non influiscono sul template originale")}.
            </p>
          </div>
        )}
        {id && !isNewFromTemplate && plan?.derived_from_template_id && derivedTemplate && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm mb-6">
            <p className="text-blue-900 dark:text-blue-100">
              {toSentenceCase("Questo piano è stato creato a partire dal template")} "
              {derivedTemplate.name}".{" "}
              {toSentenceCase("Le modifiche non influiscono sul template originale")}.
            </p>
          </div>
        )}

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium">
                {toSentenceCase("Nome piano")}
                {!id && <span className="ml-1 text-destructive">*</span>}
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
                  disabled={readonly}
                />
                {nameError && (
                  <p className="text-sm text-destructive">Il nome del piano è obbligatorio</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                {toSentenceCase("Categoria")}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px]">
                      Usata per organizzare e riutilizzare i piani (template, filtri, libreria)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Es: Forza, Ipertrofia..."
                disabled={readonly}
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label className="text-sm font-medium">{toSentenceCase("Descrizione")}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={() => setDescriptionFocused(true)}
                onBlur={() => setDescriptionFocused(false)}
                placeholder="Note generali per il cliente (opzionale)"
                rows={descriptionRows}
                className="resize-none transition-all duration-150"
                disabled={readonly}
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{toSentenceCase("Giorni di allenamento")}</h2>
              {!readonly && (
                <Button onClick={handleAddDay} variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {toSentenceCase("Aggiungi giorno")}
                </Button>
              )}
            </div>

            {days.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground mb-4">
                  {toSentenceCase("Nessun giorno ancora")}
                </p>
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
                    onAddGroup={(phaseType, groupType) =>
                      handleAddGroup(day.id, phaseType, groupType)
                    }
                    onUpdateGroup={(phaseType, groupId, updates) =>
                      handleUpdateGroup(day.id, phaseType, groupId, updates)
                    }
                    onDuplicateGroup={(phaseType, groupId) =>
                      handleDuplicateGroup(day.id, phaseType, groupId)
                    }
                    onDeleteGroup={(phaseType, groupId) =>
                      handleDeleteGroup(day.id, phaseType, groupId)
                    }
                    onAddExerciseToGroup={(phaseType, groupId) =>
                      handleAddExerciseToGroup(day.id, phaseType, groupId)
                    }
                    onUpdateExercise={(phaseType, groupId, exerciseId, patch) =>
                      handleUpdateExercise(day.id, phaseType, groupId, exerciseId, patch)
                    }
                    onDuplicateExercise={(phaseType, groupId, exerciseId) =>
                      handleDuplicateExercise(day.id, phaseType, groupId, exerciseId)
                    }
                    onDeleteExercise={(phaseType, groupId, exerciseId) =>
                      handleDeleteExercise(day.id, phaseType, groupId, exerciseId)
                    }
                    readonly={readonly}
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

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Uscire senza salvare?</AlertDialogTitle>
            <AlertDialogDescription>
              Hai modifiche non salvate. Se esci ora, andranno perse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <Button variant="outline" onClick={handleExitWithoutSave}>
              Esci senza salvare
            </Button>
            <Button onClick={handleSaveAndExit} disabled={isSaving}>
              {isSaving ? "Salvataggio..." : "Salva ed esci"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Plan Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il piano?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione eliminerà definitivamente il piano e non potrà essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeletePlan}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Before Export Dialog */}
      <AlertDialog open={saveBeforeExportOpen} onOpenChange={setSaveBeforeExportOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvare prima di esportare?</AlertDialogTitle>
            <AlertDialogDescription>
              Per esportare in PDF, salva prima il piano.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <Button onClick={handleSaveAndExport} disabled={isSaving}>
              {isSaving ? "Salvataggio..." : "Salva e esporta"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Day Picker for Session */}
      {id && clientId && (
        <DayPicker
          open={dayPickerOpen}
          onOpenChange={setDayPickerOpen}
          clientId={clientId}
          onConfirm={async (planId, dayId) => {
            const coachClientId = await getCoachClientId(clientId);
            const session = await createSession.mutateAsync({
              coach_client_id: coachClientId,
              plan_id: planId,
              day_id: dayId,
            });
            navigate(`/session/live?sessionId=${session.id}`);
          }}
        />
      )}

      {/* Sticky Save Bar */}
      <PlanEditorSaveBar
        hasChanges={hasChanges}
        isSaving={isSaving}
        isExporting={isExporting}
        canSave={canSave}
        canExport={!isExporting}
        showDelete={!!id}
        showSaveAsTemplate={!!id}
        readonly={readonly}
        onSave={handleSave}
        onExit={() => handleExitRequest()}
        onExportPDF={handleExportPDF}
        onSaveAsTemplate={() => setSaveAsTemplateOpen(true)}
        onDelete={() => setDeleteDialogOpen(true)}
      />
    </div>
  );
};

export default ClientPlanEditor;
