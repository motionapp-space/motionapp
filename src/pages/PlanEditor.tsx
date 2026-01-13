import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { DayCardCompact } from "@/components/plan-editor/DayCardCompact";
import { Objective, makeDay, makeGroup, type Day, type GroupType, type Exercise, type ExerciseGroup, migratePhaseToGroups } from "@/types/plan";
import { exportPlanToPDF } from "@/lib/pdfExport";
import { toSentenceCase } from "@/lib/text";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import CopilotPanel from "@/components/CopilotPanel";
import { FLAGS } from "@/flags";
import { supabase } from "@/integrations/supabase/client";

const PlanEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [name, setName] = useState("");
  const [objective, setObjective] = useState<Objective>("Strength");
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadPlan(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadPlan = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error) throw error;
      
      setPlan(data);
      setName(data.name);
      setObjective(data.goal as Objective || "Strength");
      setDurationWeeks(data.duration_weeks || 4);
      
      // Migrate loaded data
      const contentJson = data.content_json as any;
      const loadedDays = ((contentJson?.days || []) as Day[]).map((day: Day) => ({
        ...day,
        phases: day.phases.map(migratePhaseToGroups),
      }));
      setDays(loadedDays);
    } catch (error) {
      toast.error("Errore nel caricamento del piano");
      navigate("/plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('plans')
        .update({
          name,
          goal: objective,
          duration_weeks: durationWeeks,
          content_json: { days } as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      toast.success("Piano salvato con successo");
    } catch (error) {
      toast.error("Errore nel salvataggio");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = () => {
    if (plan) {
      exportPlanToPDF({ ...plan, name, objective, durationWeeks, days } as any);
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
      if (day.id !== dayId) return day;
      
      return {
        ...day,
        phases: day.phases.map(phase => {
          if (phase.type !== phaseType) return phase;
          
          const migratedPhase = migratePhaseToGroups(phase);
          const groupIndex = migratedPhase.groups.findIndex(g => g.id === groupId);
          if (groupIndex === -1) return phase;
          
          const group = migratedPhase.groups[groupIndex];
          const exToDup = group.exercises.find(ex => ex.id === exerciseId);
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
            ...migratedPhase.groups.slice(groupIndex + 1).map(g => ({
              ...g,
              order: g.order + 1
            })),
          ];
          
          return { ...phase, groups: newGroups };
        }),
      };
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const objectiveOptions: { value: Objective; label: string }[] = [
    { value: "Strength", label: toSentenceCase("Forza") },
    { value: "Hypertrophy", label: toSentenceCase("Ipertrofia") },
    { value: "Endurance", label: toSentenceCase("Resistenza") },
    { value: "Mobility", label: toSentenceCase("Mobilità") },
    { value: "HIIT", label: "HIIT" },
    { value: "Functional", label: toSentenceCase("Funzionale") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/plans")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-h4 font-semibold truncate preserve-case" style={{ textTransform: 'none' }}>
              {name || toSentenceCase("Nuovo piano")}
            </h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isSaving ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">{toSentenceCase("Salvataggio...")}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">{toSentenceCase("Salvato")}</span>
              </div>
            )}
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="h-11"
            >
              {toSentenceCase("Salva piano")}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportPDF}
              className="gap-2 h-11"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            
            {FLAGS.copilotEnabled && (
              <Button
                variant="outline"
                onClick={() => setCopilotOpen(true)}
                className="gap-2 h-11"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Copilot</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-7xl">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="plan-name" className="text-sm font-medium">
                {toSentenceCase("Nome piano")}
              </Label>
              <Input
                id="plan-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={toSentenceCase("Inserisci nome")}
                className="h-11 preserve-case"
                style={{ textTransform: 'none' }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal" className="text-sm font-medium">
                {toSentenceCase("Obiettivo")}
              </Label>
              <Select
                value={objective}
                onValueChange={(value) => setObjective(value as Objective)}
              >
                <SelectTrigger id="goal" className="h-11">
                  <SelectValue placeholder={toSentenceCase("Seleziona obiettivo")} />
                </SelectTrigger>
                <SelectContent>
                  {objectiveOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">
                {toSentenceCase("Durata (settimane)")}
              </Label>
              <Select
                value={durationWeeks.toString()}
                onValueChange={(value) => setDurationWeeks(parseInt(value))}
              >
                <SelectTrigger id="duration" className="h-11">
                  <SelectValue placeholder={toSentenceCase("Seleziona durata")} />
                </SelectTrigger>
                <SelectContent>
                  {[4, 6, 8, 10, 12, 16, 20, 24].map((weeks) => (
                    <SelectItem key={weeks} value={weeks.toString()}>
                      {weeks} settimane
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            {days.length === 0 ? (
              <div className="text-center py-16 border border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">
                  {toSentenceCase("Nessun giorno ancora")}
                </p>
                <Button onClick={handleAddDay} className="gap-2 h-11">
                  <Plus className="h-4 w-4" />
                  {toSentenceCase("Aggiungi giorno")}
                </Button>
              </div>
            ) : (
              <>
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
                  />
                ))}
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={handleAddDay}
                  className="w-full h-12 gap-2"
                >
                  <Plus className="h-5 w-5" />
                  {toSentenceCase("Aggiungi giorno")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <CopilotPanel open={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  );
};

export default PlanEditor;
