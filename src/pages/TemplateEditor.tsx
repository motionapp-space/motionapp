import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { X, Plus, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTopbar } from "@/contexts/TopbarContext";
import { SortableDay } from "@/components/plan-editor/SortableDay";
import { exportPlanToPDF } from "@/lib/pdfExport";
import { toSentenceCase } from "@/lib/text";
import { toast } from "sonner";
import CopilotPanel from "@/components/CopilotPanel";
import { FLAGS } from "@/flags";
import { getTemplate } from "@/features/templates/api/templates.api";
import { useUpdateTemplate } from "@/features/templates/hooks/useUpdateTemplate";
import { useCreateTemplate } from "@/features/templates/hooks/useCreateTemplate";
import { PlanEditorSaveBar } from "@/features/plans/components/PlanEditorSaveBar";
import type { PlanTemplate } from "@/types/template";
import { makeDay, makeGroup, type Day, type PhaseType, type GroupType, type Exercise, type ExerciseGroup, migratePhaseToGroups } from "@/types/plan";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

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
  
  // New state for unified dirty tracking and dialogs
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveBeforeExportOpen, setSaveBeforeExportOpen] = useState(false);
  const pendingNavigation = useRef<(() => void) | null>(null);
  
  const updateMutation = useUpdateTemplate();
  const createMutation = useCreateTemplate();
  const readonly = location.state?.readonly === true;
  const isNew = id === "new" || !id;

  // Predefined categories for suggestions
  const suggestedCategories = ["Forza", "Ipertrofia", "Resistenza", "Mobilità", "Cardio", "Funzionale"];

  // Helper to create stable snapshot
  const createSnapshot = useCallback((n: string, d: string, cats: string[], daysData: Day[]) => {
    return JSON.stringify({ name: n, description: d, categories: cats, days: daysData });
  }, []);

  // Calculate hasChanges using snapshot string comparison
  const currentSnapshot = useMemo(
    () => createSnapshot(name, description, categories, days),
    [name, description, categories, days, createSnapshot]
  );
  const hasChanges = initialSnapshot !== null && currentSnapshot !== initialSnapshot;

  const isSaving = updateMutation.isPending || createMutation.isPending;
  const canSave = hasChanges && !readonly && !isSaving && !nameError && name.trim().length > 0;

  // Default navigation function
  const defaultNavigate = useCallback(() => {
    navigate("/library?tab=templates");
  }, [navigate]);

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

  // Define handleBack using handleExitRequest
  const handleBack = useCallback(() => {
    handleExitRequest();
  }, [handleExitRequest]);

  // Configure global Topbar
  useTopbar({
    title: name || "Nuovo Template",
    showBack: true,
    onBack: handleBack,
  });

  // Drag & drop sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDayDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeLevel = active.data.current?.level;
    const overLevel = over.data.current?.level;

    if (activeLevel !== "day" || overLevel !== "day") {
      return;
    }

    const oldIndex = days.findIndex((d) => d.id === String(active.id));
    const newIndex = days.findIndex((d) => d.id === String(over.id));

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newDays = arrayMove(days, oldIndex, newIndex);
    setDays(newDays.map((day, index) => ({ ...day, order: index + 1 })));
  };

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
        if (canSave) {
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canSave]);

  // beforeunload browser guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  useEffect(() => {
    if (id && id !== "new") {
      loadTemplate(id);
    } else {
      // New template - empty state (no auto-creation of Giorno 1)
      setName("");
      setDescription("");
      setCategories([]);
      setDays([]);
      setLoading(false);
      // Set initial snapshot for empty template
      setTimeout(() => {
        setInitialSnapshot(createSnapshot("", "", [], []));
      }, 0);
    }
  }, [id, createSnapshot]);

  // Scroll to top when template finishes loading
  useEffect(() => {
    if (!loading) {
      const container = document.getElementById("coach-scroll-container");
      if (container) {
        container.scrollTop = 0;
      }
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [loading]);

  const loadTemplate = async (templateId: string) => {
    try {
      const data = await getTemplate(templateId);
      setTemplate(data);
      setName(data.name);
      setDescription(data.description || "");
      const cats = data.category ? data.category.split(',').map(c => c.trim()).filter(Boolean) : [];
      setCategories(cats);
      // Migrate loaded data
      const migratedDays = (data.data?.days || []).map((day: Day) => ({
        ...day,
        phases: day.phases.map(migratePhaseToGroups),
      }));
      setDays(migratedDays);
      // Set initial snapshot after load
      setTimeout(() => {
        setInitialSnapshot(createSnapshot(data.name, data.description || "", cats, migratedDays));
      }, 0);
    } catch (error) {
      toast.error("Errore nel caricamento del template");
      navigate("/templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (): Promise<boolean> => {
    if (!validateName(name)) {
      toast.error("Compila i campi obbligatori prima di salvare");
      return false;
    }
    
    try {
      if (isNew) {
        // CREATE: first save of a new template
        const created = await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          category: categories.join(', '),
          data: { days },
        });
        // Reset snapshot after successful creation
        setInitialSnapshot(currentSnapshot);
        toast.success("Template creato");
        // Navigate to the real template ID for future saves
        navigate(`/templates/${created.id}?mode=edit`, { replace: true });
      } else {
        // UPDATE: existing template
        await updateMutation.mutateAsync({
          id: id!,
          input: {
            name: name.trim(),
            description: description.trim(),
            category: categories.join(', '),
            data: { days },
          },
        });
        // Reset snapshot after successful save
        setInitialSnapshot(currentSnapshot);
        toast.success("Template salvato");
      }
      return true;
    } catch (error) {
      toast.error("Errore durante il salvataggio. Riprova.");
      return false;
    }
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
    setExitDialogOpen(false);
    if (success) {
      pendingNavigation.current?.();
      pendingNavigation.current = null;
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

  // PDF export with gating for unsaved templates
  const handleExportPDF = () => {
    if (isNew) {
      setSaveBeforeExportOpen(true);
      return;
    }
    setIsExporting(true);
    try {
      exportPlanToPDF({ name, description, data: { days } } as any);
    } finally {
      setIsExporting(false);
    }
  };

  // Save and export
  const handleSaveAndExport = async () => {
    try {
      await handleSave();
      setSaveBeforeExportOpen(false);
      setIsExporting(true);
      try {
        exportPlanToPDF({ name, description, data: { days } } as any);
      } finally {
        setIsExporting(false);
      }
    } catch (error) {
      // Error already shown by handleSave
    }
  };

  // Delete template (stub - need to implement hook)
  const handleDeleteTemplate = async () => {
    toast.info("Funzionalita' in arrivo");
    setDeleteDialogOpen(false);
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
    <div className="min-h-screen bg-background pb-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 max-w-[1280px]">
        <div className="space-y-6">
          {/* Metadata Section */}
          <div className="pb-4 border-b border-border space-y-4">
            <div className="grid gap-x-4 gap-y-4 md:grid-cols-3 items-start">
                {/* Name Field */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium mb-2 block">
                    {toSentenceCase("Nome template")}
                    {isNew && <span className="ml-1 text-destructive">*</span>}
                  </Label>
                  <Input
                    id="template-name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onBlur={() => validateName(name)}
                    placeholder="Es: Piano Forza 8 Settimane"
                    disabled={readonly}
                    maxLength={80}
                    className={nameError ? "border-destructive" : ""}
                  />
                  {nameError && (
                    <p className="text-sm text-destructive mt-1">{nameError}</p>
                  )}
                </div>

                {/* Category Field */}
                <div>
                  <Label className="flex items-center gap-1.5 text-sm font-medium mb-2">
                    {toSentenceCase("Categoria")}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px]">
                          Usata per organizzare e riutilizzare i template (filtri, libreria)
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="template-category"
                        variant="outline"
                        role="combobox"
                        aria-expanded={categoryOpen}
                        disabled={readonly}
                        className="w-full justify-between font-normal"
                      >
                        <span className={categories.length === 0 ? "text-muted-foreground" : ""}>
                          {categories.length === 0 ? "Es: Forza, Ipertrofia..." : `${categories.length} selezionate`}
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
                    <div className="flex flex-wrap gap-2 mt-2">
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

                {/* Description Field */}
                <div className="md:col-span-3">
                  <Label className="text-sm font-medium mb-2 block">{toSentenceCase("Descrizione")}</Label>
                  <Textarea
                    id="template-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Note generali per il template (opzionale)"
                    rows={2}
                    className="resize-none transition-all duration-150"
                    disabled={readonly}
                  />
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
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground mb-2 font-medium">
                  {toSentenceCase("Nessun giorno ancora")}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Inizia aggiungendo il primo giorno di allenamento
                </p>
                <Button onClick={handleAddDay} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {toSentenceCase("Aggiungi primo giorno")}
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDayDragEnd}
              >
                <SortableContext
                  items={days.map((d) => d.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-6" role="list" aria-label="Giorni di allenamento" data-drop-level="day" style={{ overflow: 'visible' }}>
                    {days
                      .sort((a, b) => a.order - b.order)
                      .map((day) => (
                        <SortableDay
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
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      {FLAGS.copilotEnabled && copilotOpen && (
        <CopilotPanel open={copilotOpen} onClose={() => setCopilotOpen(false)} />
      )}

      {/* Sticky Save Bar */}
      <PlanEditorSaveBar
        hasChanges={hasChanges}
        isSaving={isSaving}
        isExporting={isExporting}
        canSave={canSave}
        canExport={!isExporting}
        showDelete={!isNew}
        showSaveAsTemplate={false}
        showAI={true}
        readonly={readonly}
        onSave={handleSave}
        onExit={() => handleExitRequest()}
        onExportPDF={handleExportPDF}
        onSaveAsTemplate={() => {}}
        onDelete={() => setDeleteDialogOpen(true)}
      />

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

      {/* Delete Template Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il template?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione eliminera' definitivamente il template e non potra' essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteTemplate}>
              Elimina
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
              Per esportare in PDF, salva prima il template.
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
    </div>
  );
};

export default TemplateEditor;
