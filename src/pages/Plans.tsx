import { useState } from "react";
import { useTopbar } from "@/contexts/TopbarContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, FileText, Clock, Tag, Copy, Trash2, Eye, Pencil } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { IconTooltipButton } from "@/components/ui/icon-tooltip-button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { toSentenceCase } from "@/lib/text";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useTemplatesQuery } from "@/features/templates/hooks/useTemplatesQuery";
import { useCreateTemplate } from "@/features/templates/hooks/useCreateTemplate";
import { useDuplicateTemplate } from "@/features/templates/hooks/useDuplicateTemplate";
import { useDeleteTemplate } from "@/features/templates/hooks/useDeleteTemplate";
import { makePlan } from "@/types/plan";

const Plans = () => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useTemplatesQuery();
  const createMutation = useCreateTemplate();
  const duplicateMutation = useDuplicateTemplate();
  const deleteMutation = useDeleteTemplate();

  const createNewTemplate = async () => {
    try {
      const newPlan = makePlan("Nuovo Template");
      const template = await createMutation.mutateAsync({
        name: newPlan.name,
        data: { days: newPlan.days },
      });
      toast.success("Template creato");
      navigate(`/templates/${template.id}?mode=edit`);
    } catch (error: any) {
      toast.error("Errore nella creazione del template");
    }
  };

  const duplicateTemplate = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await duplicateMutation.mutateAsync(templateId);
      toast.success("Template duplicato");
    } catch (error: any) {
      toast.error("Errore nella duplicazione");
    }
  };

  const handleDeleteClick = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTemplateToDelete(templateId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;
    
    try {
      await deleteMutation.mutateAsync(templateToDelete);
      toast.success("Template eliminato");
    } catch (error: any) {
      toast.error("Errore nell'eliminazione");
    } finally {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: it });
    } catch {
      return dateString;
    }
  };

  useTopbar({
    title: "Template di Allenamento",
  });

  return (
    <TooltipProvider>
      <div className="container mx-auto px-6 max-w-7xl py-6">
        <div className="flex items-center justify-end mb-6">
          <Button onClick={createNewTemplate}>
            <Plus className="h-4 w-4" />
            Nuovo template
          </Button>
        </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        </div>
      ) : templates.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">{toSentenceCase("Nessun template ancora")}</h3>
          <p className="text-muted-foreground mb-6">{toSentenceCase("Crea il tuo primo template per riutilizzarlo con i clienti")}</p>
          <Button onClick={createNewTemplate} className="gap-2">
            <Plus className="h-4 w-4" />
            {toSentenceCase("Crea template")}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow flex flex-col h-full" data-testid={`template-card-${template.id}`}>
              <CardHeader>
                <CardTitle className="line-clamp-1">{template.name}</CardTitle>
                {template.category && (
                  <CardDescription className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    {template.category}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex flex-col flex-1 space-y-3">
                <div className="flex-1 space-y-3">
                  {template.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                  )}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>{toSentenceCase("creato il")}: {formatDate(template.created_at)}</div>
                    <div>{toSentenceCase("ultima modifica")}: {formatDate(template.updated_at)}</div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 pt-2 mt-auto">
                  <IconTooltipButton
                    label={toSentenceCase("Apri")}
                    onClick={() => navigate(`/templates/${template.id}?mode=read`)}
                    data-testid={`template-open-${template.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </IconTooltipButton>
                  
                  <IconTooltipButton
                    label={toSentenceCase("Modifica")}
                    onClick={() => navigate(`/templates/${template.id}?mode=edit`)}
                    data-testid={`template-edit-${template.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </IconTooltipButton>
                  
                  <IconTooltipButton
                    label={toSentenceCase("Duplica")}
                    onClick={(e) => duplicateTemplate(template.id, e)}
                    data-testid={`template-duplicate-${template.id}`}
                  >
                    <Copy className="h-4 w-4" />
                  </IconTooltipButton>
                  
                  <IconTooltipButton
                    label={toSentenceCase("Elimina")}
                    onClick={(e) => handleDeleteClick(template.id, e)}
                    className="text-destructive hover:bg-destructive/10"
                    data-testid={`template-delete-${template.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconTooltipButton>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toSentenceCase("elimina template")}?</AlertDialogTitle>
            <AlertDialogDescription>
              {toSentenceCase("i piani già assegnati ai clienti non saranno modificati")}. {toSentenceCase("questa azione non può essere annullata")}.
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
    </TooltipProvider>
  );
};

export default Plans;