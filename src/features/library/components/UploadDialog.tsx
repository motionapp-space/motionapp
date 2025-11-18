import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploadMedia } from "../hooks/useUploadMedia";
import { toast } from "sonner";
import { toSentenceCase } from "@/lib/text";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState("");
  const uploadMutation = useUploadMedia();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      await uploadMutation.mutateAsync({
        file,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      toast.success(toSentenceCase("file caricato con successo"));
      onOpenChange(false);
      setFile(null);
      setTags("");
    } catch (error) {
      toast.error(toSentenceCase("errore nel caricamento"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{toSentenceCase("carica file")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="file">{toSentenceCase("file")}</Label>
            <Input
              id="file"
              type="file"
              accept="video/*,image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>
          <div>
            <Label htmlFor="tags">{toSentenceCase("tag (separati da virgola)")}</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="es: riscaldamento, stretching"
            />
          </div>
          <Button type="submit" disabled={!file || uploadMutation.isPending}>
            {uploadMutation.isPending ? toSentenceCase("caricamento...") : toSentenceCase("carica")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
