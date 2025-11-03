import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, CheckCircle, Loader2, Sparkles, Clock, X } from "lucide-react";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const TemplateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [template, setTemplate] = useState<PlanTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<Day[]>([]);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const updateMutation = useUpdateTemplate();
  const readonly = location.state?.readonly === true;

  // Predefined categories for suggestions
  const suggestedCategories = ["Forza", "Ipertrofia", "Resistenza", "Mobilità", "Cardio", "Funzionale"];

  // Validate name
  const validateName = (value: string) => {
    if (!value.trim()) {
      setNameError("Il nome è obbligatorio");
      return false;
    }
    if (value.length < 3) {
      setNameError("Il nome deve contenere almeno 3 caratteri");
      return false;
    }
    if (value.length > 80) {
      setNameError("Il nome non può superare 80 caratteri");
      return false;
    }
    setNameError("");
    return true;
  };

  // Handle name change with validation
  const handleNameChange = (value: string) => {
    setName(value);
    if (value.trim()) {
      validateName(value);
    }
  };

  // Keyboard shortcut for save (Cmd/Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (!readonly && !updateMutation.isPending && name.trim() && validateName(name)) {
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readonly, updateMutation.isPending, name]);

  // Track changes
  useEffect(() => {
    if (template) {
      const hasChanges = 
        name !== template.name ||
        description !== (template.description || "") ||
        JSON.stringify(categories) !== JSON.stringify(template.category ? template.category.split(',').map(c => c.trim()).filter(Boolean) : []) ||
        JSON.stringify(days) !== JSON.stringify(template.data?.days || []);
      setHasUnsavedChanges(hasChanges);
    }
  }, [name, description, categories, days, template]);

  // Autosave every 30 seconds
  const autoSave = useCallback(async () => {
    if (!id || readonly || !hasUnsavedChanges || updateMutation.isPending || !validateName(name)) return;
    
    try {
      await updateMutation.mutateAsync({
        id,
        input: {
          name,
          description,
          category: categories.join(', '),
          data: { days },
        },
      });
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      // Silent fail for autosave
      console.error('Autosave failed:', error);
    }
  }, [id, readonly, hasUnsavedChanges, updateMutation, name, description, categories, days]);

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
      setCategories(data.category ? data.category.split(',').map(c => c.trim()).filter(Boolean) : []);
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
    if (!validateName(name)) {
      toast.error("Correggi gli errori prima di salvare");
      return;
    }
    
    try {
      await updateMutation.mutateAsync({
        id,
        input: {
          name: name.trim(),
          description: description.trim(),
          category: categories.join(', '),
          data: { days },
        },
      });
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      toast.success("Template salvato con successo");
    } catch (error) {
      toast.error("Errore durante il salvataggio. Riprova.");
    }
  };

  // Add category chip
  const addCategory = (cat: string) => {
    const trimmed = cat.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
    }
    setCategoryInput("");
    setCategoryOpen(false);
  };

  // Remove category chip
  const removeCategory = (cat: string) => {
    setCategories(categories.filter(c => c !== cat));
  };

  // Get save status text
  const getSaveStatus = () => {
    if (updateMutation.isPending) return "Salvataggio in corso...";
    if (hasUnsavedChanges) return "Modifiche non salvate";
    if (lastSaved) {
      const minAgo = Math.floor((Date.now() - lastSaved.getTime()) / 60000);
      if (minAgo === 0) return "salvato adesso";
      return `salvato ${minAgo} min fa`;
    }
    return "Bozza";
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
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between gap-4 max-w-[1280px]">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/templates")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">{name || "Nuovo Template"}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {readonly ? (
                  <Badge variant="secondary" className="h-5">Sola lettura</Badge>
                ) : (
                  <span>{getSaveStatus()}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!readonly && (
              <>
                <Button 
                  onClick={handleSave}
                  disabled={updateMutation.isPending || !!nameError || !name.trim()}
                  size="sm" 
                  className="gap-2"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Salva
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => navigate("/templates")} 
                  variant="ghost" 
                  size="sm"
                >
                  Annulla
                </Button>
              </>
            )}
            <Button 
              onClick={handleExportPDF} 
              variant="outline" 
              size="sm" 
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
            {FLAGS.copilotEnabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCopilotOpen(!copilotOpen)}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                AI
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-[1280px]">
        <div className="space-y-8">
          {/* Metadata Section */}
          <div className="space-y-6 pb-8 border-b border-border">
            {/* Row 1: Name (7 cols) + Category (5 cols) */}
            <div className="grid gap-6 md:grid-cols-12">
              {/* Name Field */}
              <div className="md:col-span-7 space-y-4">
                <Label 
                  htmlFor="template-name" 
                  className="text-sm font-normal text-[#4B5563]"
                >
                  Nome
                </Label>
                <div className="space-y-2">
                  <Input
                    id="template-name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onBlur={() => validateName(name)}
                    placeholder="Es: Piano Forza 8 Settimane"
                    disabled={readonly}
                    maxLength={80}
                    aria-invalid={!!nameError}
                    aria-describedby={nameError ? "name-error" : undefined}
                    className="h-10 text-sm"
                  />
                  {nameError && (
                    <p id="name-error" className="text-xs text-destructive">
                      {nameError}
                    </p>
                  )}
                </div>
              </div>

              {/* Category Field - Multi-select Combobox */}
              <div className="md:col-span-5 space-y-4">
                <Label 
                  htmlFor="template-category" 
                  className="text-sm font-normal text-[#4B5563]"
                >
                  Categoria
                </Label>
                <div className="space-y-2">
                  <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="template-category"
                        variant="outline"
                        role="combobox"
                        aria-expanded={categoryOpen}
                        disabled={readonly}
                        className="w-full h-10 justify-between font-normal"
                      >
                        <span className="text-sm text-muted-foreground">
                          {categories.length === 0 ? "Seleziona categoria..." : `${categories.length} selezionate`}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Cerca o aggiungi..." 
                          value={categoryInput}
                          onValueChange={setCategoryInput}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full"
                              onClick={() => categoryInput.trim() && addCategory(categoryInput)}
                            >
                              Crea "{categoryInput}"
                            </Button>
                          </CommandEmpty>
                          <CommandGroup>
                            {suggestedCategories
                              .filter(cat => !categories.includes(cat))
                              .map((cat) => (
                                <CommandItem
                                  key={cat}
                                  onSelect={() => addCategory(cat)}
                                >
                                  {cat}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Selected Categories as Chips */}
                  {categories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <Badge 
                          key={cat} 
                          variant="secondary" 
                          className="gap-1 pr-1"
                        >
                          {cat}
                          {!readonly && (
                            <button
                              onClick={() => removeCategory(cat)}
                              className="ml-1 hover:bg-muted rounded-sm p-0.5"
                              aria-label={`Rimuovi ${cat}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Description (full width) */}
            <div className="space-y-4">
              <Label 
                htmlFor="template-description" 
                className="text-sm font-normal text-[#4B5563]"
              >
                Descrizione
              </Label>
              <div className="relative">
                <Textarea
                  id="template-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 280))}
                  placeholder="Descrivi il template e gli obiettivi principali..."
                  disabled={readonly}
                  maxLength={280}
                  rows={2}
                  aria-describedby="description-counter"
                  className="min-h-[64px] max-h-[180px] resize-y text-sm pr-16"
                />
                <div
                  id="description-counter"
                  className="absolute bottom-2 right-3 text-xs text-muted-foreground pointer-events-none select-none"
                >
                  {description.length}/280
                </div>
              </div>
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
