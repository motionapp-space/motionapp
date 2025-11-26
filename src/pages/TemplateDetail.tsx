import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, CheckCircle, Loader2, Sparkles, Pencil } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DayCardCompact } from "@/components/plan-editor/DayCardCompact";
import { exportPlanToPDF } from "@/lib/pdfExport";
import { toSentenceCase } from "@/lib/text";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import CopilotPanel from "@/components/CopilotPanel";
import { FLAGS } from "@/flags";
import { useTemplate } from "@/features/templates/hooks/useTemplate";
import { useUpdateTemplate } from "@/features/templates/hooks/useUpdateTemplate";
import { makeDay, makeGroup, type Day, type GroupType, type Exercise, type ExerciseGroup, migratePhaseToGroups } from "@/types/plan";

export default function TemplateDetail() {
  const { id } = useParams<{ id: string }>();
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const [copilotOpen, setCopilotOpen] = useState(false);
  
  const readonlyParam = sp.get("readonly") === "1" || sp.get("readonly") === "true";
  const modeParam = sp.get("mode");
  const mode = (readonlyParam ? "read" : (modeParam ?? "read")) as "read" | "edit";
  const readonly = mode === "read";
  
  const { data: template, isError, error, isLoading } = useTemplate(id);
  const updateMutation = useUpdateTemplate();
  
  const [days, setDays] = useState<Day[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || "");
      setCategory(template.category || "");
      // Migrate loaded data
      const migratedDays = (template.data?.days || []).map((day: Day) => ({
        ...day,
        phases: day.phases.map(migratePhaseToGroups),
      }));
      setDays(migratedDays);
    }
  }, [template]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (isError && (error as any)?.code === "PGRST116") {
    navigate(`/templates/${id}/missing`, { replace: true });
    return null;
  }

  if (!template) {
    return null;
  }

  const toEdit = () => {
    setSp({ mode: "edit" }, { replace: true });
  };

  const toRead = () => {
    setSp({ mode: "read" }, { replace: true });
  };

  const handleSave = async () => {
    if (!id) return;
    
    try {
      await updateMutation.mutateAsync({
        id,
        input: {
          name,
          description,
          category,
          data: { days },
        },
      });
      toast.success(toSentenceCase("Template salvato"));
      toRead();
    } catch (error) {
      toast.error(toSentenceCase("Errore nel salvataggio"));
    }
  };

  const handleExportPDF = () => {
    if (template) {
      exportPlanToPDF({
        name,
        days,
        created_at: template.created_at,
        updated_at: template.updated_at,
      });
    }
  };

  const handleAddDay = () => {
    const newDay = makeDay(days.length + 1);
    setDays([...days, newDay]);
  };

  const handleUpdateDayTitle = (dayId: string, title: string) => {
    setDays(days.map(d => d.id === dayId ? { ...d, title } : d));
  };

  const handleDuplicateDay = (dayId: string) => {
    const dayToDup = days.find(d => d.id === dayId);
    if (!dayToDup) return;
    const newDay = { ...dayToDup, id: crypto.randomUUID(), order: days.length + 1 };
    setDays([...days, newDay]);
  };

  const handleDeleteDay = (dayId: string) => {
    setDays(days.filter(d => d.id !== dayId));
  };

  const handleAddGroup = (dayId: string, phaseType: string, groupType: GroupType) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          phases: day.phases.map(phase => {
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
    }));
  };

  const handleUpdateGroup = (dayId: string, phaseType: string, groupId: string, updates: Partial<ExerciseGroup>) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          phases: day.phases.map(phase => {
            if (phase.type === phaseType) {
              const migratedPhase = migratePhaseToGroups(phase);
              return {
                ...phase,
                groups: migratedPhase.groups.map(g => g.id === groupId ? { ...g, ...updates } : g),
              };
            }
            return phase;
          }),
        };
      }
      return day;
    }));
  };

  const handleDuplicateGroup = (dayId: string, phaseType: string, groupId: string) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          phases: day.phases.map(phase => {
            if (phase.type === phaseType) {
              const migratedPhase = migratePhaseToGroups(phase);
              const groupToDup = migratedPhase.groups.find(g => g.id === groupId);
              if (!groupToDup) return phase;
              const newGroup = {
                ...groupToDup,
                id: crypto.randomUUID(),
                exercises: groupToDup.exercises.map(ex => ({ ...ex, id: crypto.randomUUID() })),
                order: migratedPhase.groups.length + 1,
              };
              return { ...phase, groups: [...migratedPhase.groups, newGroup] };
            }
            return phase;
          }),
        };
      }
      return day;
    }));
  };

  const handleDeleteGroup = (dayId: string, phaseType: string, groupId: string) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          phases: day.phases.map(phase => {
            if (phase.type === phaseType) {
              const migratedPhase = migratePhaseToGroups(phase);
              return { ...phase, groups: migratedPhase.groups.filter(g => g.id !== groupId) };
            }
            return phase;
          }),
        };
      }
      return day;
    }));
  };

  const handleAddExerciseToGroup = (dayId: string, phaseType: string, groupId: string) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          phases: day.phases.map(phase => {
            if (phase.type === phaseType) {
              const migratedPhase = migratePhaseToGroups(phase);
              return {
                ...phase,
                groups: migratedPhase.groups.map(group => {
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
    }));
  };

  const handleUpdateExercise = (dayId: string, phaseType: string, groupId: string, exerciseId: string, updates: Partial<Exercise>) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          phases: day.phases.map(phase => {
            if (phase.type === phaseType) {
              const migratedPhase = migratePhaseToGroups(phase);
              return {
                ...phase,
                groups: migratedPhase.groups.map(group => {
                  if (group.id === groupId) {
                    return {
                      ...group,
                      exercises: group.exercises.map(ex =>
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
    }));
  };

  const handleDuplicateExercise = (dayId: string, phaseType: string, groupId: string, exerciseId: string) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          phases: day.phases.map(phase => {
            if (phase.type === phaseType) {
              const migratedPhase = migratePhaseToGroups(phase);
              return {
                ...phase,
                groups: migratedPhase.groups.map(group => {
                  if (group.id === groupId) {
                    const exToDup = group.exercises.find(ex => ex.id === exerciseId);
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
    }));
  };

  const handleDeleteExercise = (dayId: string, phaseType: string, groupId: string, exerciseId: string) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          phases: day.phases.map(phase => {
            if (phase.type === phaseType) {
              const migratedPhase = migratePhaseToGroups(phase);
              return {
                ...phase,
                groups: migratedPhase.groups.map(group => {
                  if (group.id === groupId) {
                    return { ...group, exercises: group.exercises.filter(ex => ex.id !== exerciseId) };
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
    }));
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/templates")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-h4 font-semibold truncate">{name || "Template"}</h1>
              {readonly && <Badge variant="secondary">{toSentenceCase("Sola lettura")}</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {mode === "read" ? (
              <Button onClick={toEdit} size="default" className="h-10 gap-2" data-testid="btn-edit-template">
                <Pencil className="h-4 w-4" />
                {toSentenceCase("Modifica")}
              </Button>
            ) : (
              <>
                {updateMutation.isPending ? (
                  <Button disabled size="default" className="h-10 gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {toSentenceCase("Salvataggio...")}
                  </Button>
                ) : (
                  <Button onClick={handleSave} size="default" className="h-10 gap-2" data-testid="btn-save-template">
                    <CheckCircle className="h-4 w-4" />
                    {toSentenceCase("Salva")}
                  </Button>
                )}
                <Button variant="outline" onClick={toRead} size="default" className="h-10" data-testid="btn-cancel-edit">
                  {toSentenceCase("Annulla")}
                </Button>
              </>
            )}
            <Button onClick={handleExportPDF} variant="outline" size="default" className="h-10 gap-2">
              <Download className="h-4 w-4" />
              PDF
            </Button>
            {FLAGS.copilotEnabled && (
              <Button
                variant="outline"
                size="default"
                className="h-10 gap-2"
                onClick={() => setCopilotOpen(!copilotOpen)}
              >
                <Sparkles className="h-4 w-4" />
                AI
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{toSentenceCase("Nome template")}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Es: Piano Forza 8 Settimane"
                disabled={readonly}
              />
            </div>
            <div className="space-y-2">
              <Label>{toSentenceCase("Categoria")}</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Es: Forza, Ipertrofia..."
                disabled={readonly}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{toSentenceCase("Descrizione")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrizione del template..."
              rows={3}
              disabled={readonly}
            />
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
                  {toSentenceCase("Nessun giorno ancora. Inizia ad aggiungerne uno!")}
                </p>
                {!readonly && (
                  <Button onClick={handleAddDay} variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    {toSentenceCase("Aggiungi primo giorno")}
                  </Button>
                )}
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
                    onUpdateGroup={(phaseType, groupId, updates) => handleUpdateGroup(day.id, phaseType, groupId, updates)}
                    onDuplicateGroup={(phaseType, groupId) => handleDuplicateGroup(day.id, phaseType, groupId)}
                    onDeleteGroup={(phaseType, groupId) => handleDeleteGroup(day.id, phaseType, groupId)}
                    onAddExerciseToGroup={(phaseType, groupId) => handleAddExerciseToGroup(day.id, phaseType, groupId)}
                    onUpdateExercise={(phaseType, groupId, exerciseId, patch) => handleUpdateExercise(day.id, phaseType, groupId, exerciseId, patch)}
                    onDuplicateExercise={(phaseType, groupId, exerciseId) => handleDuplicateExercise(day.id, phaseType, groupId, exerciseId)}
                    onDeleteExercise={(phaseType, groupId, exerciseId) => handleDeleteExercise(day.id, phaseType, groupId, exerciseId)}
                    readonly={readonly}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

        {FLAGS.copilotEnabled && copilotOpen && (
          <CopilotPanel open={copilotOpen} onClose={() => setCopilotOpen(false)} />
        )}
      </div>
    </TooltipProvider>
  );
}
