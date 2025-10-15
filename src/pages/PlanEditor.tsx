import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Share2 } from "lucide-react";
import { usePlanStore } from "@/stores/usePlanStore";
import { WeeksBoard } from "@/components/plan-editor/WeeksBoard";
import { Objective } from "@/types/plan";

const PlanEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { plan, loadPlan, setPlanName, setObjective, setDurationWeeks, isSaving } = usePlanStore();

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
    { value: "Strength", label: "Forza" },
    { value: "Hypertrophy", label: "Ipertrofia" },
    { value: "Endurance", label: "Resistenza" },
    { value: "Mobility", label: "Mobilità" },
    { value: "HIIT", label: "HIIT" },
    { value: "Functional", label: "Funzionale" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/plans")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 max-w-xl">
              <Input
                value={plan.name}
                onChange={(e) => setPlanName(e.target.value)}
                className="text-lg font-semibold border-0 focus-visible:ring-0 px-2"
                placeholder="Nome del piano"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSaving && (
              <span className="text-sm text-muted-foreground">Salvataggio...</span>
            )}
            {!isSaving && (
              <span className="text-sm text-green-600 font-medium">Salvato ✅</span>
            )}
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Condividi
            </Button>
          </div>
        </div>
      </header>

      {/* Editor Content */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Plan Settings */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="goal">Obiettivo</Label>
              <Select
                value={plan.objective}
                onValueChange={(value) => setObjective(value as Objective)}
              >
                <SelectTrigger id="goal">
                  <SelectValue placeholder="Seleziona obiettivo" />
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
              <Label htmlFor="duration">Durata (settimane)</Label>
              <Select
                value={plan.durationWeeks.toString()}
                onValueChange={(value) => setDurationWeeks(parseInt(value))}
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Seleziona durata" />
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

          {/* Weeks Board */}
          <WeeksBoard />
        </div>
      </div>
    </div>
  );
};

export default PlanEditor;