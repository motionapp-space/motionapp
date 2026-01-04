import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Download, CheckCircle, Loader2, Sparkles, Clock, X } from "lucide-react";
import { useTopbar } from "@/contexts/TopbarContext";
import { SortableDay } from "@/components/plan-editor/SortableDay";
import { exportPlanToPDF } from "@/lib/pdfExport";
import { toSentenceCase } from "@/lib/text";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import CopilotPanel from "@/components/CopilotPanel";
import { FLAGS } from "@/flags";
import { getTemplate } from "@/features/templates/api/templates.api";
import { useUpdateTemplate } from "@/features/templates/hooks/useUpdateTemplate";
import { useCreateTemplate } from "@/features/templates/hooks/useCreateTemplate";
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [showDescription, setShowDescription] = useState(true);
  
  const updateMutation = useUpdateTemplate();
  const createMutation = useCreateTemplate();
  const readonly = location.state?.readonly === true;
  const isNew = id === "new" || !id;

  // Define handleBack before useTopbar (needed for onBack callback)
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate("/library?tab=templates");
    }
  }, [hasUnsavedChanges, navigate]);

  // Configure global Topbar
  useTopbar({
    title: name || "Nuovo Template",
    showBack: true,
    onBack: handleBack,
  });

  // Drag & drop sensors
  // Sensors for drag & drop with proper activation constraints
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 6, // Require 6px movement before drag starts
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

    // Debug assertions (verify stable IDs)
    console.assert(days.every(d => !!d.id), 'Day without stable id detected');
    console.log('Order before:', days.map(d => ({ id: d.id, title: d.title, order: d.order })));
    console.log('Move:', active.id, '→', over.id);

    // Validate level
    const activeLevel = active.data.current?.level;
    const overLevel = over.data.current?.level;

    if (activeLevel !== "day" || overLevel !== "day") {
      console.warn("Cross-level drag attempt blocked", { activeLevel, overLevel });
      return;
    }

    // Find indices using stable IDs
    const oldIndex = days.findIndex((d) => d.id === String(active.id));
    const newIndex = days.findIndex((d) => d.id === String(over.id));

    if (oldIndex === -1 || newIndex === -1) {
      console.error("Invalid indices for day drag - IDs mismatch!", { 
        oldIndex, 
        newIndex, 
        activeId: active.id, 
        overId: over.id,
        dayIds: days.map(d => d.id),
        sortableItems: days.map(d => d.id),
      });
      return;
    }

    console.log("Reordering days:", { 
      from: oldIndex, 
      to: newIndex,
      dayTitle: days[oldIndex].title,
    });

    // Immutable reorder using dnd-kit's arrayMove
    const newDays = arrayMove(days, oldIndex, newIndex);
    
    // Update state with new order values
    setDays(newDays.map((day, index) => ({ ...day, order: index + 1 })));
    
    console.log('Order after:', newDays.map(d => ({ id: d.id, title: d.title, order: d.order })));
    
    // TODO: Persist order (debounced) to prevent "snap back"
    // debouncedSaveDaysOrder(newDays);
  };

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

  // Autosave every 30 seconds (only for existing templates)
  const autoSave = useCallback(async () => {
    if (isNew || readonly || !hasUnsavedChanges || updateMutation.isPending || !validateName(name)) return;
    
    try {
      await updateMutation.mutateAsync({
        id: id!,
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
  }, [id, isNew, readonly, hasUnsavedChanges, updateMutation, name, description, categories, days]);

  useEffect(() => {
    const interval = setInterval(autoSave, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [autoSave]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (id && id !== "new") {
      loadTemplate(id);
    } else {
      // New template - auto-create Giorno 1 for immediate editing (Notion-style)
      setName("");
      setDescription("");
      setCategories([]);
      const initialDay = makeDay(1);
      setDays([initialDay]);
      setIsEditorMode(true); // Enter editor mode immediately
      setLoading(false);
      setHasUnsavedChanges(false);
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
    if (!validateName(name)) {
      toast.error("Correggi gli errori prima di salvare");
      return;
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
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        toast.success("Template salvato");
      }
    } catch (error) {
      toast.error("Errore durante il salvataggio. Riprova.");
    }
  };

  // handleBack is defined earlier with useCallback for useTopbar

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
    if (updateMutation.isPending || createMutation.isPending) return "Salvataggio in corso...";
    if (isNew) return "Nuovo template";
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
    // Enter editor mode when adding a day
    if (!isEditorMode) {
      setIsEditorMode(true);
      setShowDescription(false);
    }
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
    <div className="min-h-screen bg-background">
      {/* Toolbar with actions - in page content, not Topbar */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-4 max-w-[1280px]">
        <div className="flex items-center justify-end gap-2 mb-2">
          {readonly && <Badge variant="secondary">Sola lettura</Badge>}
          {!readonly && (
            <>
              <Button 
                onClick={handleSave}
                disabled={updateMutation.isPending || createMutation.isPending || !!nameError || !name.trim()}
                size="sm" 
                className="gap-2"
              >
                {(updateMutation.isPending || createMutation.isPending) ? (
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
                onClick={handleBack} 
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

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 max-w-[1280px]">
        <div className="space-y-6">
          {/* Metadata Section - Compact when in editor mode */}
          <div className={`pb-4 border-b border-border transition-all ${isEditorMode ? 'space-y-2' : 'space-y-4'}`}>
            {isEditorMode ? (
              // Compact editor mode header
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Input
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={() => validateName(name)}
                  placeholder="Nome template"
                  disabled={readonly}
                  maxLength={80}
                  className="h-9 text-lg font-semibold border-0 bg-transparent focus:bg-muted/20 max-w-[300px] md:max-w-[400px]"
                />
                
                {/* Category chips inline */}
                {categories.length > 0 && (
                  <div className="flex items-center gap-1">
                    {categories.map((cat) => (
                      <Badge 
                        key={cat} 
                        variant="secondary" 
                        className="text-xs gap-1 pr-1"
                      >
                        {cat}
                        {!readonly && (
                          <button
                            onClick={() => removeCategory(cat)}
                            className="ml-0.5 hover:bg-muted rounded-sm p-0.5"
                            aria-label={`Rimuovi ${cat}`}
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Save status inline */}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {getSaveStatus()}
                </span>
                
                {/* Toggle description visibility */}
                {description && (
                  <button
                    onClick={() => setShowDescription(!showDescription)}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-2"
                  >
                    {showDescription ? 'Nascondi descrizione' : 'Mostra descrizione'}
                  </button>
                )}
              </div>
            ) : (
              // Full metadata view (initial state)
              <>
                {/* Row 1: Name (7 cols) + Category (5 cols) */}
                <div className="grid gap-4 md:grid-cols-12">
                  {/* Name Field */}
                  <div className="md:col-span-7 space-y-1.5">
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
                        className="h-9 text-sm"
                      />
                      {nameError && (
                        <p id="name-error" className="text-xs text-destructive">
                          {nameError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Category Field - Multi-select Combobox */}
                  <div className="md:col-span-5 space-y-1.5">
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
              </>
            )}

            {/* Description - collapsible in editor mode */}
            {(!isEditorMode || showDescription) && (
              <div className={`space-y-4 ${isEditorMode ? 'pt-2' : ''}`}>
                {!isEditorMode && (
                  <Label 
                    htmlFor="template-description" 
                    className="text-sm font-normal text-[#4B5563]"
                  >
                    Descrizione
                  </Label>
                )}
                <div className="relative">
                  <Textarea
                    id="template-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 280))}
                    placeholder="Descrivi il template e gli obiettivi principali..."
                    disabled={readonly}
                    maxLength={280}
                    rows={isEditorMode ? 1 : 2}
                    aria-describedby="description-counter"
                    className={`resize-y text-sm pr-16 ${isEditorMode ? 'min-h-[40px] max-h-[80px] border-0 bg-muted/30' : 'min-h-[64px] max-h-[180px]'}`}
                  />
                  <div
                    id="description-counter"
                    className="absolute bottom-2 right-3 text-xs text-muted-foreground pointer-events-none select-none"
                  >
                    {description.length}/280
                  </div>
                </div>
              </div>
            )}
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
              {!readonly && (
                <div className="flex items-center gap-2">
                  <Button onClick={handleAddDay} variant="outline" size="sm" className="gap-2 h-11">
                    <Plus className="h-4 w-4" />
                    {toSentenceCase("Aggiungi giorno")}
                  </Button>
                </div>
              )}
            </div>

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
          </div>
        </div>
      </div>

      {FLAGS.copilotEnabled && copilotOpen && (
        <CopilotPanel open={copilotOpen} onClose={() => setCopilotOpen(false)} />
      )}

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifiche non salvate</AlertDialogTitle>
            <AlertDialogDescription>
              Hai delle modifiche non salvate. Vuoi davvero uscire senza salvare?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Resta</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => navigate("/library?tab=templates")}
              className="bg-destructive hover:bg-destructive/90"
            >
              Esci senza salvare
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TemplateEditor;
