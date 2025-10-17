import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ExternalLink, Edit, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientPlanWithTemplate } from "@/types/template";
import { toSentenceCase } from "@/lib/text";

interface ClientPlanCardProps {
  plan: ClientPlanWithTemplate;
  onEdit?: () => void;
  onUpdateStatus?: (status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED') => void;
}

export function ClientPlanCard({ plan, onEdit, onUpdateStatus }: ClientPlanCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: it });
    } catch {
      return dateString;
    }
  };

  const statusColors = {
    ACTIVE: "bg-green-500/10 text-green-700 dark:text-green-400",
    COMPLETED: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    EXPIRED: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
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
        {plan.derived_from_template_id && plan.template && (
          <div className="text-sm text-muted-foreground">
            <span>{toSentenceCase("derivato da template")}: </span>
            <Link
              to={`/templates/${plan.derived_from_template_id}`}
              className="text-primary underline underline-offset-2 hover:opacity-90 inline-flex items-center gap-1"
              state={{ readonly: true }}
            >
              {plan.template.name}
              <ExternalLink className="h-3 w-3" />
            </Link>
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
          
          {plan.status === 'ACTIVE' && onUpdateStatus && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus('COMPLETED')}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {toSentenceCase("completa")}
            </Button>
          )}
          
          {plan.status !== 'EXPIRED' && onUpdateStatus && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onUpdateStatus('EXPIRED')}
              className="gap-2 text-muted-foreground"
            >
              <XCircle className="h-4 w-4" />
              {toSentenceCase("scaduto")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
