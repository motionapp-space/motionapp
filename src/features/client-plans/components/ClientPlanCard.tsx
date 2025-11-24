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

  const getStatusBadge = () => {
    const badges = [];
    
    // In Uso badge (most important)
    if (plan.is_in_use) {
      badges.push(
        <Badge key="in-use" className="bg-green-500/10 text-green-700 dark:text-green-400">
          <Star className="h-3 w-3 mr-1" />
          {toSentenceCase("In uso")}
        </Badge>
      );
    }
    
    // Status badge
    if (plan.status === "IN_CORSO") {
      badges.push(
        <Badge key="status" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
          {toSentenceCase("Attivo")}
        </Badge>
      );
    } else if (plan.status === "COMPLETATO") {
      badges.push(
        <Badge key="status" className="bg-purple-500/10 text-purple-700 dark:text-purple-400">
          {toSentenceCase("Completato")}
        </Badge>
      );
    } else if (plan.status === "ELIMINATO") {
      badges.push(
        <Badge key="status" className="bg-gray-500/10 text-gray-700 dark:text-gray-400">
          {toSentenceCase("Archiviato")}
        </Badge>
      );
    }

    return badges;
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleArchiveClick = () => {
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
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{plan.name}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {getStatusBadge()}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  {toSentenceCase("Duplica piano")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onToggleInUse}>
                  <Star className={`h-4 w-4 mr-2 ${plan.is_in_use ? 'fill-current' : ''}`} />
                  {plan.is_in_use 
                    ? toSentenceCase("Rimuovi da In Uso")
                    : toSentenceCase("Imposta come In Uso")
                  }
                </DropdownMenuItem>
                {plan.status === 'IN_CORSO' && (
                  <DropdownMenuItem onClick={onComplete}>
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
                <DropdownMenuItem onClick={onToggleVisibility}>
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
                <DropdownMenuItem onClick={onSaveAsTemplate}>
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
        </CardHeader>
        
        <CardContent className="space-y-3">
          {plan.description && (
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          )}

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
                  >
                    {toSentenceCase("Recupera")}
                  </Button>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  <span>{toSentenceCase("Da template")}: </span>
                  <button
                    type="button"
                    onClick={openTemplate}
                    className="text-primary underline underline-offset-2 hover:opacity-90 inline-flex items-center gap-1"
                  >
                    {template?.name || toSentenceCase("Caricamento...")}
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              📅 {toSentenceCase("Creato il")}: {formatDate(plan.created_at)}
            </div>
            <div className="flex items-center gap-1">
              📝 {toSentenceCase("Modificato")}: {formatDate(plan.updated_at)}
            </div>
            {plan.completed_at && (
              <div className="flex items-center gap-1">
                ✅ {toSentenceCase("Completato")}: {formatDate(plan.completed_at)}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            {!plan.is_visible && (
              <Badge variant="outline" className="text-xs">
                <EyeOff className="h-3 w-3 mr-1" />
                {toSentenceCase("Nascosto")}
              </Badge>
            )}
            {plan.locked_at && (
              <Badge variant="outline" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                {toSentenceCase("Bloccato")}
              </Badge>
            )}
          </div>

          <Button 
            size="sm" 
            onClick={onEdit}
            className="w-full gap-2 mt-2"
          >
            {toSentenceCase("Apri piano")}
          </Button>
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
