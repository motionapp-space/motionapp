import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, CheckCircle, Loader2, Sparkles } from "lucide-react";
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
import { makeDay, type Day, type PhaseType } from "@/types/plan";

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
  
  const updateMutation = useUpdateTemplate();
  const readonly = location.state?.readonly === true;

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
      setDays(data.data?.days || []);
    } catch (error) {
      toast.error("Errore nel caricamento del template");
      navigate("/templates");
    } finally {
      setLoading(false);
    }
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

  const handleDuplicateDay = (dayId: string) => {
    const dayToDup = days.find(d => d.id === dayId);
    if (!dayToDup) return;
    const newDay = { ...dayToDup, id: crypto.randomUUID(), order: days.length + 1 };
    setDays([...days, newDay]);
  };

  const handleDeleteDay = (dayId: string) => {
    setDays(days.filter(d => d.id !== dayId));
  };

  const handleAddExercise = (dayId: string) => (phaseType: PhaseType) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          phases: day.phases.map(phase => {
            if (phase.type === phaseType) {
              const newExercise = {
                id: crypto.randomUUID(),
                name: "",
                sets: 3,
                reps: "10",
                load: "",
                rest: "01:00",
                notes: "",
                order: phase.exercises.length + 1,
              };
              return { ...phase, exercises: [...phase.exercises, newExercise] };
            }
            return phase;
          }),
        };
      }
      return day;
    }));
  };

  const handleUpdateExercise = (dayId: string) => (phaseType: PhaseType, exerciseId: string, updates: any) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          phases: day.phases.map(phase => {
            if (phase.type === phaseType) {
              return {
                ...phase,
                exercises: phase.exercises.map(ex =>
                  ex.id === exerciseId ? { ...ex, ...updates } : ex
                ),
              };
            }
            return phase;
          }),
        };
      }
      return day;
    }));
  };

  const handleDuplicateExercise = (dayId: string) => (phaseType: PhaseType, exerciseId: string) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          phases: day.phases.map(phase => {
            if (phase.type === phaseType) {
              const exToDup = phase.exercises.find(ex => ex.id === exerciseId);
              if (!exToDup) return phase;
              const newEx = { ...exToDup, id: crypto.randomUUID(), order: phase.exercises.length + 1 };
              return { ...phase, exercises: [...phase.exercises, newEx] };
            }
            return phase;
          }),
        };
      }
      return day;
    }));
  };

  const handleDeleteExercise = (dayId: string) => (phaseType: PhaseType, exerciseId: string) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          phases: day.phases.map(phase => {
            if (phase.type === phaseType) {
              return { ...phase, exercises: phase.exercises.filter(ex => ex.id !== exerciseId) };
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
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!readonly && (
              <>
                {updateMutation.isPending ? (
                  <Button disabled size="sm">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {toSentenceCase("Salvataggio...")}
                  </Button>
                ) : (
                  <Button onClick={handleSave} size="sm" className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {toSentenceCase("Salva")}
                  </Button>
                )}
              </>
            )}
            <Button onClick={handleExportPDF} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              PDF
            </Button>
            {FLAGS.copilotEnabled && (
              <Button
                variant="outline"
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
                    onAddExercise={handleAddExercise(day.id)}
                    onUpdateExercise={handleUpdateExercise(day.id)}
                    onDuplicateExercise={handleDuplicateExercise(day.id)}
                    onDeleteExercise={handleDeleteExercise(day.id)}
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
  );
};

export default TemplateEditor;
