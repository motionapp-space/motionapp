import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, CheckCircle, Loader2, Sparkles, Clock } from "lucide-react";
import { DayCardCompact } from "@/components/plan-editor/DayCardCompact";
import { exportPlanToPDF } from "@/lib/pdfExport";
import { toSentenceCase } from "@/lib/text";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import CopilotPanel from "@/components/CopilotPanel";
import { FLAGS } from "@/flags";
import { getTemplate } from "@/features/templates/api/templates.api";
import { useUpdateTemplate } from "@/features/templates/hooks/useUpdateTemplate";
import type { PlanTemplate } from "@/types/template";
import { makeDay, makeGroup, type Day, type PhaseType, type GroupType, type Exercise, type ExerciseGroup, migratePhaseToGroups } from "@/types/plan";

const TemplateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [template, setTemplate] = useState<PlanTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<Day[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const updateMutation = useUpdateTemplate();
  const readonly = location.state?.readonly === true;

  // Track changes
  useEffect(() => {
    if (template) {
      const hasChanges = 
        name !== template.name ||
        description !== (template.description || "") ||
        category !== (template.category || "") ||
        JSON.stringify(days) !== JSON.stringify(template.data?.days || []);
      setHasUnsavedChanges(hasChanges);
    }
  }, [name, description, category, days, template]);

  // Autosave every 30 seconds
  const autoSave = useCallback(async () => {
    if (!id || readonly || !hasUnsavedChanges || updateMutation.isPending) return;
    
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
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      // Silent fail for autosave
      console.error('Autosave failed:', error);
    }
  }, [id, readonly, hasUnsavedChanges, updateMutation, name, description, category, days]);

  useEffect(() => {
    const interval = setInterval(autoSave, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [autoSave]);

  useEffect(() => {
    if (id) {
      loadTemplate(id);
    }
  }, [id]);

  const loadTemplate = async (templateId: string) => {
    try {
      const data = await getTemplate(templateId);
      setTemplate(data);
      setName(data.name);
      setDescription(data.description || "");
      setCategory(data.category || "");
      // Migrate loaded data
      const migratedDays = (data.data?.days || []).map((day: Day) => ({
        ...day,
        phases: day.phases.map(migratePhaseToGroups),
      }));
      setDays(migratedDays);
    } catch (error) {
      toast.error("Errore nel caricamento del template");
      navigate("/templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    if (!name.trim()) {
      toast.error("Il nome del template è obbligatorio");
      return;
    }
    
    try {
      await updateMutation.mutateAsync({
        id,
        input: {
          name: name.trim(),
          description,
          category,
          data: { days },
        },
      });
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      toast.success("Template salvato");
    } catch (error) {
      toast.error("Errore nel salvataggio");
    }
  };

  const handleExportPDF = () => {
    if (template) {
      exportPlanToPDF({ ...template, days } as any);
    }
  };

  const handleAddDay = () => {
    const newDay = makeDay(days.length + 1);
    setDays([...days, newDay]);
  };

  const handleUpdateDayTitle = (dayId: string, title: string) => {
    setDays(days.map(d => d.id === dayId ? { ...d, title } : d));
  };

  const handleUpdateDayObjective = (dayId: string, objective: string) => {
    setDays(days.map(d => d.id === dayId ? { ...d, objective } : d));
  };

  const handleUpdatePhaseObjective = (dayId: string, phaseType: PhaseType, objective: string) => {
    setDays(days.map(d => 
      d.id === dayId 
        ? {
            ...d,
            phases: d.phases.map(p => 
              p.type === phaseType ? { ...p, objective } : p
            )
          }
        : d
    ));
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

  const handleAddGroup = (dayId: string, phaseType: PhaseType, groupType: GroupType) => {
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

  const handleUpdateGroup = (dayId: string, phaseType: PhaseType, groupId: string, updates: Partial<ExerciseGroup>) => {
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

  const handleDuplicateGroup = (dayId: string, phaseType: PhaseType, groupId: string) => {
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

  const handleDeleteGroup = (dayId: string, phaseType: PhaseType, groupId: string) => {
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

  const handleAddExerciseToGroup = (dayId: string, phaseType: PhaseType, groupId: string) => {
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

  const handleUpdateExercise = (dayId: string, phaseType: PhaseType, groupId: string, exerciseId: string, updates: Partial<Exercise>) => {
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

  const handleDuplicateExercise = (dayId: string, phaseType: PhaseType, groupId: string, exerciseId: string) => {
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

  const handleDeleteExercise = (dayId: string, phaseType: PhaseType, groupId: string, exerciseId: string) => {
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
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
              {readonly && <Badge variant="secondary">Sola lettura</Badge>}
              {!readonly && hasUnsavedChanges && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Non salvato
                </Badge>
              )}
              {!readonly && !hasUnsavedChanges && lastSaved && (
                <span className="text-xs text-muted-foreground">
                  Salvato {Math.floor((Date.now() - lastSaved.getTime()) / 60000)} min fa
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!readonly && (
              <>
                {updateMutation.isPending ? (
                  <Button disabled size="sm" className="min-w-[44px] min-h-[44px]">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {toSentenceCase("Salvataggio...")}
                  </Button>
                ) : (
                  <Button onClick={handleSave} size="sm" className="gap-2 min-w-[44px] min-h-[44px]">
                    <CheckCircle className="h-4 w-4" />
                    {toSentenceCase("Salva")}
                  </Button>
                )}
                <Button 
                  onClick={() => navigate("/templates")} 
                  variant="outline" 
                  size="sm"
                  className="min-w-[44px] min-h-[44px]"
                  aria-label="Annulla modifiche"
                >
                  {toSentenceCase("Annulla")}
                </Button>
                <div className="h-6 w-px bg-border" aria-hidden="true" />
              </>
            )}
            <Button 
              onClick={handleExportPDF} 
              variant="outline" 
              size="sm" 
              className="gap-2 min-w-[44px] min-h-[44px]"
              aria-label="Esporta in PDF"
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
            {FLAGS.copilotEnabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCopilotOpen(!copilotOpen)}
                className="gap-2 min-w-[44px] min-h-[44px]"
                title="Genera o ottimizza il piano"
                aria-label="Apri assistente AI"
              >
                <Sparkles className="h-4 w-4" />
                AI
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-6xl">
        <div className="space-y-4">
          {/* Metadata Section - Compact Layout */}
          <div className="space-y-4 pb-4 border-b border-border">
            {/* Row 1: Name and Category */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[13px] font-semibold text-[#4B5563]">Nome</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Es: Piano Forza 8 Settimane"
                  disabled={readonly}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[13px] font-semibold text-[#4B5563]">Categoria</Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Es. Forza / Ipertrofia"
                  disabled={readonly}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Row 2: Description */}
            <div className="space-y-1">
              <Label className="text-[13px] font-semibold text-[#4B5563]">Descrizione</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrizione del template..."
                rows={2}
                disabled={readonly}
                className="min-h-[60px] max-h-[120px] resize-none text-sm py-2"
              />
            </div>
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{toSentenceCase("Giorni di allenamento")}</h2>
                {days.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {days.length} {days.length === 1 ? 'giorno' : 'giorni'}
                  </span>
                )}
              </div>
              {!readonly && days.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button onClick={handleAddDay} variant="outline" size="sm" className="gap-2 h-11">
                    <Plus className="h-4 w-4" />
                    {toSentenceCase("Aggiungi giorno")}
                  </Button>
                </div>
              )}
            </div>

            {days.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">
                  Nessun giorno ancora
                </p>
                {!readonly && (
                  <Button 
                    onClick={handleAddDay} 
                    variant="default" 
                    className="gap-2 min-w-[44px] min-h-[44px]"
                    aria-label="Aggiungi primo giorno di allenamento"
                  >
                    <Plus className="h-4 w-4" />
                    {toSentenceCase("Aggiungi giorno")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6" role="list" aria-label="Giorni di allenamento">
                {days.map((day, index) => (
                  <div key={day.id} role="listitem" aria-label={`Giorno ${index + 1}`}>
                    <DayCardCompact
                      day={day}
                      onUpdateTitle={(title) => handleUpdateDayTitle(day.id, title)}
                      onUpdateObjective={(objective) => handleUpdateDayObjective(day.id, objective)}
                      onUpdatePhaseObjective={(phaseType, objective) => handleUpdatePhaseObjective(day.id, phaseType, objective)}
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
                  </div>
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
  );
};

export default TemplateEditor;
