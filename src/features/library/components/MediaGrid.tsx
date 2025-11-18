import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Image, Video, Trash2, Eye, Download, MoreVertical, FolderOpen, Upload, Search, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDeleteMedia } from "../hooks/useDeleteMedia";
import { useRenameMedia } from "../hooks/useRenameMedia";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { LibraryMedia } from "../types";

interface MediaGridProps {
  media: LibraryMedia[];
  search?: string;
  fileType?: string;
  onClearFilters?: () => void;
  onUploadClick?: () => void;
}

export default function MediaGrid({ media, search, fileType, onClearFilters, onUploadClick }: MediaGridProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<LibraryMedia | null>(null);
  const [newFilename, setNewFilename] = useState("");
  const deleteMutation = useDeleteMedia();
  const renameMutation = useRenameMedia();

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteMutation.mutateAsync(itemToDelete);
      toast.success("File eliminato");
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      toast.error("Errore nell'eliminazione");
    }
  };

  const handleRenameClick = (item: LibraryMedia) => {
    setItemToRename(item);
    setNewFilename(item.filename);
    setRenameDialogOpen(true);
  };

  const confirmRename = async () => {
    if (!itemToRename || !newFilename.trim()) return;
    try {
      await renameMutation.mutateAsync({ id: itemToRename.id, newFilename: newFilename.trim() });
      setRenameDialogOpen(false);
      setItemToRename(null);
      setNewFilename("");
    } catch (error) {
      // Error handling done in hook
    }
  };

  const handleDownload = async (item: LibraryMedia) => {
    try {
      const response = await fetch(item.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Errore durante il download");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-12 w-12 text-primary/40" />;
      case 'image': return <Image className="h-12 w-12 text-primary/40" />;
      default: return <FileText className="h-12 w-12 text-primary/40" />;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: it });
  };

  if (media.length === 0) {
    if (search || fileType) {
      // No results state
      return (
        <Card className="p-12 text-center">
          <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Nessun risultato</h3>
          <p className="text-muted-foreground mb-6">
            Nessun file corrisponde ai tuoi filtri
          </p>
          <Button variant="outline" onClick={onClearFilters}>
            Cancella filtri
          </Button>
        </Card>
      );
    }

    // True empty state
    return (
      <Card className="p-12 text-center">
        <div className="mb-6">
          <FolderOpen className="h-20 w-20 mx-auto text-primary/20" />
        </div>
        <h3 className="text-2xl font-semibold mb-3">
          Nessun file caricato
        </h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Carica video, immagini o documenti per iniziare a costruire la tua libreria multimediale.
        </p>
        <Button onClick={onUploadClick} size="lg" className="gap-2">
          <Upload className="h-5 w-5" />
          Carica File
        </Button>
      </Card>
    );
  }

  return (
    <>
      <div 
        className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        data-testid="media-grid"
      >
        {media.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* Mini Preview Area */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background h-32 flex items-center justify-center border-b">
              {getIcon(item.file_type)}
            </div>
            
            <CardContent className="p-4 space-y-3">
              {/* Filename */}
              <h3 className="font-semibold text-lg line-clamp-1" title={item.filename}>
                {item.filename}
              </h3>
              
              {/* Upload Date */}
              <p className="text-sm text-muted-foreground">
                Caricato: {formatDate(item.created_at)}
              </p>
              
              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Primary Action Button */}
              <Button 
                onClick={() => window.open(item.file_url, '_blank')}
                className="w-full gap-2"
              >
                <Eye className="h-4 w-4" />
                Visualizza File
              </Button>
              
              {/* Kebab Menu */}
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleDownload(item)}>
                      <Download className="h-4 w-4 mr-2" />
                      Scarica
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRenameClick(item)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Rinomina
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDeleteClick(item.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Elimina
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina File</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo file? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rinomina File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-filename">Nuovo nome</Label>
              <Input
                id="new-filename"
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value)}
                placeholder="Nome file"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmRename();
                  }
                }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={confirmRename} disabled={!newFilename.trim() || renameMutation.isPending}>
                Salva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
