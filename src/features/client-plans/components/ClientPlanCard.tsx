import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { ExternalLink, MoreVertical, Star, Copy, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientPlanWithActive } from "../types";
import { toSentenceCase } from "@/lib/text";
import { useTemplate } from "@/features/templates/hooks/useTemplate";
import { useState } from "react";

interface ClientPlanCardProps {
  plan: ClientPlanWithActive;
  isActive: boolean;
  onEdit?: () => void;
  onSetActive?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onSaveAsTemplate?: () => void;
}

export function ClientPlanCard({ 
  plan, 
  isActive,
  onEdit,
  onSetActive,
  onDuplicate,
  onDelete,
  onSaveAsTemplate
}: ClientPlanCardProps) {
  const navigate = useNavigate();
  const templateId = plan.derived_from_template_id ?? null;
  const { data: template, isError, error } = useTemplate(templateId ?? undefined);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: it });
    } catch {
      return dateString;
    }
  };

  const openTemplate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!templateId) return;
    
    if (isError && (error as any)?.code === "PGRST116") {
      navigate(`/templates/${templateId}/missing`, { 
        state: { planId: plan.id } 
      });
    } else {
      navigate(`/templates/${templateId}?mode=read`);
    }
  };

  const handleCardClick = () => {
    onEdit?.();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete?.();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card 
        className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
        onClick={handleCardClick}
      >
        <CardContent className="p-5">
          {/* Top Row: Title + Badges + Menu */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold leading-tight">
                  {plan.name}
                </h3>
                {isActive && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    In uso • Visibile al cliente
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Primary action: Metti in uso (only for non-active plans) */}
              {!isActive && onSetActive && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onSetActive(); }}
                  className="gap-1.5"
                >
                  <Star className="h-3.5 w-3.5" />
                  Metti in uso
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
                    <FileText className="h-4 w-4 mr-2" />
                    {toSentenceCase("Apri piano")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}>
                    <Copy className="h-4 w-4 mr-2" />
                    {toSentenceCase("Duplica piano")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSaveAsTemplate?.(); }}>
                    <FileText className="h-4 w-4 mr-2" />
                    {toSentenceCase("Salva come template")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleDeleteClick}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {toSentenceCase("Elimina")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Template Origin */}
          {templateId && !isError && (
            <div className="text-sm text-muted-foreground mb-2">
              <span>{toSentenceCase("Da template")}: </span>
              <button
                type="button"
                onClick={openTemplate}
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                {template?.name || toSentenceCase("Caricamento...")}
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Temporal Metadata */}
          <div className="text-xs text-muted-foreground">
            {toSentenceCase("Creato il")} {formatDate(plan.created_at)}
            {" • "}
            {toSentenceCase("Modificato il")} {formatDate(plan.updated_at)}
            {plan.last_used_at && (
              <>
                {" • "}
                {toSentenceCase("Ultimo utilizzo")} {formatDate(plan.last_used_at)}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminazione (non ripristinabile dall'app)</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare il piano "{plan.name}". Non è possibile ripristinare un piano eliminato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{toSentenceCase("Annulla")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {toSentenceCase("Elimina")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
