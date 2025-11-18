import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploadMedia } from "../hooks/useUploadMedia";
import { toast } from "sonner";
import { Upload, FileCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadMedia();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = ['video/', 'image/', 'application/pdf'];
    const isValid = validTypes.some(type => selectedFile.type.startsWith(type));
    
    if (!isValid) {
      toast.error("Tipo di file non supportato. Usa video, immagini o PDF.");
      return;
    }
    
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (selectedFile.size > maxSize) {
      toast.error("File troppo grande (max 50MB)");
      return;
    }
    
    setFile(selectedFile);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      await uploadMutation.mutateAsync({
        file,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      toast.success("File caricato con successo");
      onOpenChange(false);
      setFile(null);
      setTags("");
    } catch (error) {
      toast.error("Errore nel caricamento del file");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setFile(null);
    setTags("");
    setIsDragging(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Carica File</DialogTitle>
          <DialogDescription>
            Carica video, immagini o documenti PDF nella tua libreria
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
              isDragging 
                ? "border-primary bg-primary/5 scale-[1.02]" 
                : "border-muted-foreground/25 hover:border-primary hover:bg-accent/50",
              file && "border-primary bg-primary/5"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,image/*,.pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            {!file ? (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium mb-1">
                    Trascina un file qui
                  </p>
                  <p className="text-sm text-muted-foreground">
                    oppure clicca per selezionare
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supportati: Video, Immagini, PDF (max 50MB)
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileCheck className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm line-clamp-1" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  Rimuovi
                </Button>
              </div>
            )}
          </div>
          
          {/* Tags Input */}
          <div className="space-y-2">
            <Label htmlFor="tags">
              Tag <span className="text-muted-foreground font-normal">(opzionale)</span>
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="es: riscaldamento, stretching"
            />
            <p className="text-xs text-muted-foreground">
              Separa i tag con virgola
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={!file || uploadMutation.isPending}
              className="gap-2"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Caricamento...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Carica File
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
