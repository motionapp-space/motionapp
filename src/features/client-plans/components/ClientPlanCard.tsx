import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Edit, CheckCircle, XCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientPlanWithTemplate } from "@/types/template";
import { toSentenceCase } from "@/lib/text";
import { useTemplate } from "@/features/templates/hooks/useTemplate";

interface ClientPlanCardProps {
  plan: ClientPlanWithTemplate;
  onEdit?: () => void;
  onUpdateStatus?: (status: 'IN_CORSO' | 'COMPLETATO' | 'ELIMINATO') => void;
}

export function ClientPlanCard({ plan, onEdit, onUpdateStatus }: ClientPlanCardProps) {
  const navigate = useNavigate();
  const templateId = plan.derived_from_template_id ?? null;
  const { data: template, isError, error } = useTemplate(templateId ?? undefined);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: it });
    } catch {
      return dateString;
    }
  };

  const openTemplate = () => {
    if (!templateId) return;
    
    // If template is missing (404), navigate to missing page
    if (isError && (error as any)?.code === "PGRST116") {
      navigate(`/templates/${templateId}/missing`, { 
        state: { planId: plan.id } 
      });
    } else {
      // Navigate to read mode
      navigate(`/templates/${templateId}?mode=read`);
    }
  };

  const statusColors: Record<string, string> = {
    IN_CORSO: "bg-green-500/10 text-green-700 dark:text-green-400",
    COMPLETATO: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    ELIMINATO: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            {plan.description && (
              <CardDescription className="mt-1">{plan.description}</CardDescription>
            )}
          </div>
          <Badge className={statusColors[plan.status]}>
            {plan.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {templateId && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            {isError && (error as any)?.code === "PGRST116" ? (
              <>
                <Info className="h-4 w-4 text-destructive" />
                <span>{toSentenceCase("Template eliminato")}</span>
                <Button
                  variant="link"
                  className="px-0 h-auto text-primary"
                  onClick={() => navigate(`/templates/${templateId}/missing`, { state: { planId: plan.id } })}
                  data-testid={`missing-template-${templateId}`}
                >
                  {toSentenceCase("Recupera: salva come nuovo template")}
                </Button>
              </>
            ) : (
              <>
                <span>{toSentenceCase("derivato da template")}: </span>
                <button
                  type="button"
                  onClick={openTemplate}
                  className="text-primary underline underline-offset-2 hover:opacity-90 inline-flex items-center gap-1"
                  data-testid={`derived-template-${templateId}`}
                  aria-label={toSentenceCase("Apri template derivato (sola lettura)")}
                >
                  {template?.name || toSentenceCase("Caricamento...")}
                  <ExternalLink className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <div>{toSentenceCase("assegnato il")}: {formatDate(plan.created_at)}</div>
          <div>{toSentenceCase("ultima modifica")}: {formatDate(plan.updated_at)}</div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={onEdit} className="gap-2">
            <Edit className="h-4 w-4" />
            {toSentenceCase("modifica")}
          </Button>
          
          {plan.status === 'IN_CORSO' && onUpdateStatus && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus('COMPLETATO')}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {toSentenceCase("completa")}
            </Button>
          )}
          
          {plan.status !== 'ELIMINATO' && onUpdateStatus && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onUpdateStatus('ELIMINATO')}
              className="gap-2 text-muted-foreground"
            >
              <XCircle className="h-4 w-4" />
              {toSentenceCase("elimina")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
