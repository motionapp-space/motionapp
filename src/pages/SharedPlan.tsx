import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, Target, User } from "lucide-react";
import { toast } from "sonner";

interface SharedPlanData {
  plan_name: string;
  goal: string | null;
  duration_weeks: number | null;
  content_json: any;
  coach_name: string | null;
}

const SharedPlan = () => {
  const { token } = useParams();
  const [plan, setPlan] = useState<SharedPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (token) {
      loadSharedPlan();
    }
  }, [token]);

  const loadSharedPlan = async () => {
    try {
      const { data, error } = await supabase.rpc("get_shared_plan", {
        share_token: token,
      });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        setError(true);
        return;
      }

      setPlan(data[0]);
    } catch (error: any) {
      toast.error("Piano non trovato o link scaduto");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Piano Non Trovato</CardTitle>
            <CardDescription>
              Il piano condiviso non esiste o il link è scaduto
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="container mx-auto max-w-4xl">
        <Card className="shadow-2xl">
          <CardHeader className="space-y-4">
            <div>
              <CardTitle className="text-3xl mb-2">{plan.plan_name}</CardTitle>
              <CardDescription className="text-base">Piano di allenamento condiviso</CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-4 border-t">
              {plan.coach_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Coach:</span>
                  <span className="font-medium">{plan.coach_name}</span>
                </div>
              )}
              {plan.goal && (
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Obiettivo:</span>
                  <span className="font-medium capitalize">{plan.goal}</span>
                </div>
              )}
              {plan.duration_weeks && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Durata:</span>
                  <span className="font-medium">{plan.duration_weeks} settimane</span>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="border-2 border-dashed rounded-2xl p-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Contenuto del Piano</h3>
              <p className="text-muted-foreground">
                La visualizzazione completa del piano sarà disponibile a breve
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SharedPlan;