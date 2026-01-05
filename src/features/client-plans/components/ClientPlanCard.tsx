import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { ExternalLink, MoreVertical, Star, Copy, Trash2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
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
        className="cursor-pointer border border-border/60 transition-colors duration-150 hover:bg-muted/20 hover:border-border"
        onClick={handleCardClick}
      >
        <CardContent className="p-5 md:p-5 p-4">
          {/* Top Row: Star + Title/Status + Menu */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3 flex-1 min-w-0">
              {/* Stella cliccabile con tooltip - centrata otticamente */}
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isActive) onSetActive?.();
                    }}
                    className={cn(
                      "shrink-0 mt-0.5 p-1 -m-1 rounded-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                      isActive 
                        ? "text-primary cursor-default" 
                        : "text-muted-foreground hover:text-primary cursor-pointer group/star"
                    )}
                    aria-label={isActive ? "Piano in uso" : "Imposta come piano in uso"}
                  >
                    <Star className={cn(
                      "h-4 w-4 transition-all",
                      isActive && "fill-current",
                      !isActive && "group-hover/star:fill-primary/20"
                    )} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {isActive ? "Piano in uso" : "Imposta come piano in uso"}
                </TooltipContent>
              </Tooltip>

              {/* Colonna titolo + stato */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg md:text-xl font-semibold leading-6">
                  {plan.name}
                </h3>
                {isActive && (
                  <p className="text-sm text-muted-foreground/80 mt-0.5">
                    In uso · visibile al cliente
                  </p>
                )}
              </div>
            </div>
            
            {/* Menu ⋮ allineato al titolo */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="shrink-0 p-2 rounded-md text-muted-foreground transition-colors hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
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

          {/* Metadata block */}
          <div className="mt-3 text-sm text-muted-foreground/80 space-y-1">
            {/* Template Origin */}
            {templateId && !isError && (
              <div>
                <span>{toSentenceCase("Da template")}: </span>
                <button
                  type="button"
                  onClick={openTemplate}
                  className="text-primary/90 hover:text-primary underline-offset-2 hover:underline inline-flex items-center gap-1"
                >
                  {template?.name || toSentenceCase("Caricamento...")}
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Temporal Metadata */}
            <div>
              {toSentenceCase("Creato il")} {formatDate(plan.created_at)}
              <span className="text-muted-foreground/40"> · </span>
              {toSentenceCase("Modificato il")} {formatDate(plan.updated_at)}
              {plan.last_used_at && (
                <>
                  <span className="text-muted-foreground/40"> · </span>
                  {toSentenceCase("Ultimo utilizzo")} {formatDate(plan.last_used_at)}
                </>
              )}
            </div>
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
