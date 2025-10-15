import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Share2, Save } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

interface Plan {
  id: string;
  name: string;
  goal: string | null;
  duration_weeks: number | null;
  content_json: any;
}

const PlanEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const debouncedPlan = useDebounce(plan, 800);

  useEffect(() => {
    if (id) {
      loadPlan();
    }
  }, [id]);

  useEffect(() => {
    if (debouncedPlan && !loading) {
      savePlan();
    }
  }, [debouncedPlan]);

  const loadPlan = async () => {
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setPlan(data);
    } catch (error: any) {
      toast.error("Errore nel caricamento del piano");
      navigate("/plans");
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    if (!plan || saving) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("plans")
        .update({
          name: plan.name,
          goal: plan.goal,
          duration_weeks: plan.duration_weeks,
          content_json: plan.content_json,
        })
        .eq("id", plan.id);

      if (error) throw error;
      toast.success("Salvato ✅", { duration: 2000 });
    } catch (error: any) {
      toast.error("Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !plan) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
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
                onChange={(e) => setPlan({ ...plan, name: e.target.value })}
                className="text-lg font-semibold border-0 focus-visible:ring-0 px-2"
                placeholder="Nome del piano"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-sm text-muted-foreground">Salvataggio...</span>
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
                value={plan.goal || ""}
                onValueChange={(value) => setPlan({ ...plan, goal: value })}
              >
                <SelectTrigger id="goal">
                  <SelectValue placeholder="Seleziona obiettivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strength">Forza</SelectItem>
                  <SelectItem value="hypertrophy">Ipertrofia</SelectItem>
                  <SelectItem value="mobility">Mobilità</SelectItem>
                  <SelectItem value="bodyweight">Corpo Libero</SelectItem>
                  <SelectItem value="conditioning">Condizionamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Durata (settimane)</Label>
              <Select
                value={plan.duration_weeks?.toString() || ""}
                onValueChange={(value) => setPlan({ ...plan, duration_weeks: parseInt(value) })}
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Seleziona durata" />
                </SelectTrigger>
                <SelectContent>
                  {[4, 6, 8, 10, 12, 16].map((weeks) => (
                    <SelectItem key={weeks} value={weeks.toString()}>
                      {weeks} settimane
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Workout Editor - Placeholder */}
          <div className="border-2 border-dashed rounded-2xl p-12 text-center">
            <Save className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Editor in Costruzione</h3>
            <p className="text-muted-foreground mb-6">
              L'editor completo per settimane, giorni ed esercizi sarà disponibile a breve.
            </p>
            <p className="text-sm text-muted-foreground">
              Le modifiche al nome, obiettivo e durata vengono salvate automaticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanEditor;