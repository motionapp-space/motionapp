import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Info, MoreVertical, Eye, EyeOff, Lock, Star, Copy, CheckCircle, Archive, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { ClientPlanWithTemplate } from "@/types/template";
import { toSentenceCase } from "@/lib/text";
import { useTemplate } from "@/features/templates/hooks/useTemplate";
import { useState } from "react";

interface ClientPlanCardProps {
  plan: ClientPlanWithTemplate;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onToggleInUse?: () => void;
  onComplete?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onToggleVisibility?: () => void;
  onSaveAsTemplate?: () => void;
}

export function ClientPlanCard({ 
  plan, 
  onEdit,
  onDuplicate,
  onToggleInUse,
  onComplete,
  onArchive,
  onDelete,
  onToggleVisibility,
  onSaveAsTemplate
}: ClientPlanCardProps) {
  const navigate = useNavigate();
  const templateId = plan.derived_from_template_id ?? null;
  const { data: template, isError, error } = useTemplate(templateId ?? undefined);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const formatDate = (dateString: string) => {
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

  const handleArchiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowArchiveDialog(true);
  };

  const confirmDelete = () => {
    onDelete?.();
    setShowDeleteDialog(false);
  };

  const confirmArchive = () => {
    onArchive?.();
    setShowArchiveDialog(false);
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
              <h3 className="text-lg font-semibold leading-tight mb-2">
                {plan.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {plan.is_in_use && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <Star className="h-3 w-3 mr-1" />
                    {toSentenceCase("In uso")}
                  </Badge>
                )}
                {plan.status === "IN_CORSO" && (
                  <Badge variant="outline" className="text-xs">
                    {toSentenceCase("Attivo")}
                  </Badge>
                )}
                {plan.status === "COMPLETATO" && (
                  <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-400">
                    {toSentenceCase("Completato")}
                  </Badge>
                )}
                {plan.status === "ELIMINATO" && (
                  <Badge variant="outline" className="text-xs">
                    {toSentenceCase("Archiviato")}
                  </Badge>
                )}
                {plan.locked_at && (
                  <Badge variant="outline" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    {toSentenceCase("Bloccato")}
                  </Badge>
                )}
              </div>
            </div>
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
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleInUse?.(); }}>
                  <Star className={`h-4 w-4 mr-2 ${plan.is_in_use ? 'fill-current' : ''}`} />
                  {plan.is_in_use 
                    ? toSentenceCase("Rimuovi da In Uso")
                    : toSentenceCase("Imposta come In Uso")
                  }
                </DropdownMenuItem>
                {plan.status === 'IN_CORSO' && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onComplete?.(); }}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {toSentenceCase("Segna come completato")}
                  </DropdownMenuItem>
                )}
                {plan.status !== 'ELIMINATO' && (
                  <DropdownMenuItem onClick={handleArchiveClick}>
                    <Archive className="h-4 w-4 mr-2" />
                    {toSentenceCase("Archivia")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleVisibility?.(); }}>
                  {plan.is_visible ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      {toSentenceCase("Nascondi al cliente")}
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      {toSentenceCase("Rendi visibile")}
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSaveAsTemplate?.(); }}>
                  <FileText className="h-4 w-4 mr-2" />
                  {toSentenceCase("Salva come template")}
                </DropdownMenuItem>
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
            {plan.completed_at && (
              <>
                {" • "}
                {toSentenceCase("Completato il")} {formatDate(plan.completed_at)}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toSentenceCase("Archiviare questo piano?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {toSentenceCase("Il piano non sarà più visibile nella lista principale, ma potrai sempre recuperarlo dalla sezione piani archiviati.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{toSentenceCase("Annulla")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive}>
              {toSentenceCase("Archivia")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toSentenceCase("Eliminare definitivamente?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {toSentenceCase("Questa azione non può essere annullata. Il piano verrà eliminato permanentemente.")}
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
