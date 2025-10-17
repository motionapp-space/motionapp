import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading } from "@/components/ui/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, FileText, Clock, Target, Copy, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { toSentenceCase } from "@/lib/text";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Plan {
  id: string;
  name: string;
  goal: string | null;
  duration_weeks: number | null;
  is_template: boolean;
  created_at: string;
  updated_at: string;
  content_json?: any;
}

const TEMPLATES = [
  { name: "Piano Forza 8 Settimane", goal: "strength", duration_weeks: 8 },
  { name: "Piano Ipertrofia 12 Settimane", goal: "hypertrophy", duration_weeks: 12 },
  { name: "Piano Mobilità 4 Settimane", goal: "mobility", duration_weeks: 4 },
  { name: "Piano Corpo Libero 6 Settimane", goal: "bodyweight", duration_weeks: 6 },
];

const Plans = () => {
  const navigate = useNavigate();
  const [myPlans, setMyPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
    
    // Reload plans when page becomes visible (e.g., navigating back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadPlans();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("is_template", false)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setMyPlans(data || []);
    } catch (error: any) {
      toast.error("Errore nel caricamento dei piani");
    } finally {
      setLoading(false);
    }
  };

  const createNewPlan = async () => {
    try {
      const { data: coach } = await supabase.auth.getUser();
      if (!coach.user) return;

      const { data, error } = await supabase
        .from("plans")
        .insert({
          coach_id: coach.user.id,
          name: "Nuovo Piano",
          goal: null,
          duration_weeks: 4,
          is_template: false,
          content_json: { weeks: [] },
        })
        .select()
        .single();

      if (error) throw error;
      navigate(`/plans/${data.id}/edit`);
    } catch (error: any) {
      toast.error("Errore nella creazione del piano");
    }
  };

  const createFromTemplate = async (template: typeof TEMPLATES[0]) => {
    try {
      const { data: coach } = await supabase.auth.getUser();
      if (!coach.user) return;

      const { data, error } = await supabase
        .from("plans")
        .insert({
          coach_id: coach.user.id,
          name: template.name,
          goal: template.goal,
          duration_weeks: template.duration_weeks,
          is_template: false,
          content_json: { weeks: [] },
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Piano creato dal template!");
      navigate(`/plans/${data.id}/edit`);
    } catch (error: any) {
      toast.error("Errore nella creazione del piano");
    }
  };

  const duplicatePlan = async (plan: Plan, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data: coach } = await supabase.auth.getUser();
      if (!coach.user) return;

      const { data, error } = await supabase
        .from("plans")
        .insert({
          coach_id: coach.user.id,
          name: `${plan.name}_copia`,
          goal: plan.goal,
          duration_weeks: plan.duration_weeks,
          is_template: false,
          content_json: plan.content_json || { weeks: [] },
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Piano duplicato correttamente");
      await loadPlans();
    } catch (error: any) {
      toast.error("Errore nella duplicazione del piano");
    }
  };

  const handleDeleteClick = (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlanToDelete(planId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;
    
    try {
      const { error } = await supabase
        .from("plans")
        .delete()
        .eq("id", planToDelete);

      if (error) throw error;
      toast.success("Piano eliminato con successo");
      await loadPlans();
    } catch (error: any) {
      toast.error("Errore nell'eliminazione del piano");
    } finally {
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: it });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <PageHeading className="mb-2">{toSentenceCase("I tuoi piani")}</PageHeading>
        <p className="text-muted-foreground">{toSentenceCase("Crea, modifica e gestisci i tuoi piani di allenamento")}</p>
      </div>

      <Tabs defaultValue="my-plans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-plans">{toSentenceCase("I miei piani")}</TabsTrigger>
          <TabsTrigger value="templates">{toSentenceCase("Template")}</TabsTrigger>
        </TabsList>

        <TabsContent value="my-plans" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">{toSentenceCase("I miei piani")}</h2>
              <p className="text-sm text-muted-foreground">{toSentenceCase("Gestisci i tuoi piani personalizzati")}</p>
            </div>
            <Button onClick={createNewPlan} className="gap-2">
              <Plus className="h-4 w-4" />
              {toSentenceCase("Nuovo piano")}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            </div>
          ) : myPlans.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">{toSentenceCase("Nessun piano ancora")}</h3>
              <p className="text-muted-foreground mb-6">{toSentenceCase("Inizia creando il tuo primo piano di allenamento")}</p>
              <Button onClick={createNewPlan} className="gap-2">
                <Plus className="h-4 w-4" />
                {toSentenceCase("Crea il tuo primo piano")}
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
              {myPlans.map((plan) => (
                <Card key={plan.id} className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full" onClick={() => navigate(`/plans/${plan.id}/edit`)}>
                  <CardHeader>
                    <CardTitle className="line-clamp-1 preserve-case" style={{ textTransform: 'none' }}>{plan.name}</CardTitle>
                    {plan.goal && (
                      <CardDescription className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        {plan.goal}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 space-y-3">
                    <div className="flex-1 space-y-3">
                      {plan.duration_weeks && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {plan.duration_weeks} settimane
                        </div>
                      )}
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div>{toSentenceCase("creato il")}: {formatDate(plan.created_at)}</div>
                        <div>{toSentenceCase("ultima modifica")}: {formatDate(plan.updated_at)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 mt-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => duplicatePlan(plan, e)}
                        className="flex-1 gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        {toSentenceCase("duplica")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDeleteClick(plan.id, e)}
                        className="flex-1 gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        {toSentenceCase("elimina")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">{toSentenceCase("Template")}</h2>
            <p className="text-sm text-muted-foreground">{toSentenceCase("Inizia da un template predefinito")}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
            {TEMPLATES.map((template, index) => (
              <Card key={index} className="h-full flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    {template.goal}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Clock className="h-4 w-4" />
                    {template.duration_weeks} settimane
                  </div>
                  <div className="mt-auto">
                    <Button onClick={() => createFromTemplate(template)} className="w-full h-12">
                      {toSentenceCase("Usa template")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toSentenceCase("elimina piano")}?</AlertDialogTitle>
            <AlertDialogDescription>
              {toSentenceCase("sei sicuro di voler eliminare questo piano? questa azione non può essere annullata")}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{toSentenceCase("annulla")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {toSentenceCase("elimina")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Plans;