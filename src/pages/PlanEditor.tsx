import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, CheckCircle, Loader2 } from "lucide-react";
import { usePlanStore } from "@/stores/usePlanStore";
import { DayCardCompact } from "@/components/plan-editor/DayCardCompact";
import { Objective } from "@/types/plan";
import { exportPlanToPDF } from "@/lib/pdfExport";
import { toSentenceCase } from "@/lib/text";
import { Plus } from "lucide-react";

const PlanEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    plan, 
    loadPlan, 
    setPlanName, 
    setObjective, 
    setDurationWeeks, 
    isSaving,
    save,
    addDay,
    updateDayTitle,
    duplicateDay,
    deleteDay,
    addExercise,
    updateExercise,
    duplicateExercise,
    deleteExercise,
  } = usePlanStore();

  useEffect(() => {
    if (id) {
      loadPlan(id);
    }
  }, [id, loadPlan]);

  if (!plan) {
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

  const handleSave = () => {
    save();
  };

  const handleExportPDF = () => {
    if (plan) {
      exportPlanToPDF(plan);
    }
  };

  // Flatten all days from all weeks for days-first view
  const allDays = plan?.weeks.flatMap(week => 
    week.days.map(day => ({ ...day, weekId: week.id }))
  ) || [];

  // Get first week ID for adding days (ensure at least one week exists)
  const firstWeekId = plan?.weeks[0]?.id || '';
  
  const handleAddDay = () => {
    if (firstWeekId) {
      addDay(firstWeekId);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <h1 className="text-h4 font-semibold truncate">
              {toSentenceCase("Nuovo piano")}
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
          </div>
        </div>
      </header>

      {/* Editor Content */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Plan Context Bar */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="plan-name" className="text-sm font-medium">
                {toSentenceCase("Nome piano")}
              </Label>
              <Input
                id="plan-name"
                value={plan.name}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder={toSentenceCase("Inserisci nome")}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal" className="text-sm font-medium">
                {toSentenceCase("Obiettivo")}
              </Label>
              <Select
                value={plan.objective}
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
                value={plan.durationWeeks.toString()}
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

          {/* Days List (Days-First View) */}
          <div className="space-y-4 md:space-y-6">
            {allDays.length === 0 ? (
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
                {allDays.map((day) => (
                  <DayCardCompact
                    key={day.id}
                    day={day}
                    weekId={day.weekId}
                    onUpdateTitle={(title) => updateDayTitle(day.weekId, day.id, title)}
                    onDuplicate={() => duplicateDay(day.weekId, day.id)}
                    onDelete={() => deleteDay(day.weekId, day.id)}
                    onAddExercise={(phaseType) => addExercise(day.weekId, day.id, phaseType)}
                    onUpdateExercise={(phaseType, exerciseId, patch) => 
                      updateExercise(day.weekId, day.id, phaseType, exerciseId, patch)
                    }
                    onDuplicateExercise={(phaseType, exerciseId) => 
                      duplicateExercise(day.weekId, day.id, phaseType, exerciseId)
                    }
                    onDeleteExercise={(phaseType, exerciseId) => 
                      deleteExercise(day.weekId, day.id, phaseType, exerciseId)
                    }
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
    </div>
  );
};

export default PlanEditor;