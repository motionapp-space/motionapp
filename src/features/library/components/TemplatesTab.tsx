import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, FileText, Copy, Trash2, Eye, Pencil, Search, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useTemplatesQuery } from "@/features/templates/hooks/useTemplatesQuery";
import { useDuplicateTemplate } from "@/features/templates/hooks/useDuplicateTemplate";
import { useDeleteTemplate } from "@/features/templates/hooks/useDeleteTemplate";

type SortOption = "modified" | "name-asc" | "name-desc";

export default function TemplatesTab() {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  
  // New state for controls
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("modified");

  const { data: templates = [], isLoading } = useTemplatesQuery();
  const duplicateMutation = useDuplicateTemplate();
  const deleteMutation = useDeleteTemplate();

  // Filtered and sorted templates
  const filteredAndSortedTemplates = useMemo(() => {
    let result = [...templates];
    
    // Search filter
    if (searchQuery) {
      result = result.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort
    switch (sortBy) {
      case "modified":
        result.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name, 'it'));
        break;
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name, 'it'));
        break;
    }
    
    return result;
  }, [templates, searchQuery, sortBy]);

  const createNewTemplate = () => {
    // Navigate to editor with "new" - template will only be created on save
    navigate("/templates/new?mode=edit");
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

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Control Bar */}
      <div className="space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Sort Dropdown */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Ordina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="modified">Ultima modifica</SelectItem>
            <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
            <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
          </SelectContent>
        </Select>
        
        {/* New Template Button */}
        <Button 
          onClick={createNewTemplate} 
          className="w-full md:w-auto gap-2"
          data-testid="create-template-btn"
        >
          <Plus className="h-4 w-4" />
          Nuovo Template
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        </div>
      ) : filteredAndSortedTemplates.length === 0 ? (
        searchQuery ? (
          // No results state
          <Card className="p-12 text-center">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Nessun risultato</h3>
            <p className="text-muted-foreground mb-6">
              Nessun template corrisponde alla tua ricerca "{searchQuery}"
            </p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Cancella ricerca
            </Button>
          </Card>
        ) : (
          // True empty state
          <Card className="p-12 text-center">
            <div className="mb-6">
              <FileText className="h-20 w-20 mx-auto text-primary/20" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Non hai ancora creato template
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Risparmia tempo costruendo strutture di allenamento riutilizzabili. 
              Crea il tuo primo template ora.
            </p>
            <Button onClick={createNewTemplate} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Nuovo Template
            </Button>
          </Card>
        )
      ) : (
        // Templates Grid
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-testid="templates-grid">
          {filteredAndSortedTemplates.map((template) => (
            <Card 
              key={template.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow" 
              data-testid={`template-card-${template.id}`}
            >
              {/* Mini Preview Area */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background h-32 flex items-center justify-center border-b">
                <FileText className="h-12 w-12 text-primary/40" />
              </div>
              
              <CardContent className="p-4 space-y-3">
                {/* Template Name */}
                <h3 className="font-semibold text-lg line-clamp-1" title={template.name}>
                  {template.name}
                </h3>
                
                {/* Last Edited Date */}
                <p className="text-sm text-muted-foreground">
                  Ultima modifica: {formatDate(template.updated_at)}
                </p>
                
                {/* Primary Action Button */}
                <Button 
                  onClick={() => navigate(`/templates/${template.id}/edit`)}
                  className="w-full gap-2"
                  data-testid={`template-edit-${template.id}`}
                >
                  <Pencil className="h-4 w-4" />
                  Modifica Template
                </Button>
                
                {/* Kebab Menu */}
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem 
                        onClick={() => navigate(`/templates/${template.id}?mode=read`)}
                        data-testid={`template-open-${template.id}`}
                      >
                        <Eye className="h-4 w-4" />
                        Visualizza
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => duplicateTemplate(template.id, e as any)}
                        data-testid={`template-duplicate-${template.id}`}
                      >
                        <Copy className="h-4 w-4" />
                        Duplica
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => handleDeleteClick(template.id, e as any)}
                        className="text-destructive focus:text-destructive"
                        data-testid={`template-delete-${template.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        Elimina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sticky Mobile CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50">
        <Button 
          onClick={createNewTemplate} 
          className="w-full gap-2"
          size="lg"
        >
          <Plus className="h-5 w-5" />
          Nuovo Template
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Template</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo template? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
