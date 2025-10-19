import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { toSentenceCase } from "@/lib/text";
import { useSaveAsTemplate } from "@/features/client-plans/hooks/useSaveAsTemplate";

export default function TemplateMissing() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { state } = useLocation() as { state?: { planId?: string } };
  const saveAsTemplateMutation = useSaveAsTemplate();

  const onRecover = async () => {
    if (!state?.planId) {
      toast.error(toSentenceCase("Piano non trovato"));
      return;
    }

    try {
      const result = await saveAsTemplateMutation.mutateAsync({
        planId: state.planId,
        input: { name: "Recuperato da piano cliente", also_assign: false },
      });
      
      toast.success(toSentenceCase("Nuovo template creato"));
      nav(`/templates/${result.id}?readonly=1`, { replace: true });
    } catch (error) {
      toast.error(toSentenceCase("Errore nel recupero"));
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive" data-testid="template-missing-alert">
          <Info className="h-4 w-4" />
          <AlertTitle>{toSentenceCase("Template non trovato")}</AlertTitle>
          <AlertDescription>
            {toSentenceCase("Il template")} ({id}) {toSentenceCase("potrebbe essere stato eliminato. I tuoi piani cliente non sono stati modificati.")}
          </AlertDescription>
        </Alert>
        
        <div className="mt-6 flex gap-3">
          {state?.planId && (
            <Button
              variant="default"
              onClick={onRecover}
              disabled={saveAsTemplateMutation.isPending}
              data-testid="recover-template"
            >
              {saveAsTemplateMutation.isPending
                ? toSentenceCase("Salvataggio...")
                : toSentenceCase("Salva piano corrente come nuovo template")}
            </Button>
          )}
          <Button variant="outline" onClick={() => nav(-1)}>
            {toSentenceCase("Torna indietro")}
          </Button>
        </div>
      </div>
    </div>
  );
}
