import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Image, Video, Trash2, Eye } from "lucide-react";
import { useDeleteMedia } from "../hooks/useDeleteMedia";
import { toast } from "sonner";
import { toSentenceCase } from "@/lib/text";
import type { LibraryMedia } from "../types";

interface MediaGridProps {
  media: LibraryMedia[];
}

export default function MediaGrid({ media }: MediaGridProps) {
  const deleteMutation = useDeleteMedia();

  const handleDelete = async (id: string) => {
    if (!confirm(toSentenceCase("eliminare questo file?"))) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(toSentenceCase("file eliminato"));
    } catch (error) {
      toast.error(toSentenceCase("errore nell'eliminazione"));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-8 w-8" />;
      case 'image': return <Image className="h-8 w-8" />;
      default: return <FileText className="h-8 w-8" />;
    }
  };

  if (media.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">{toSentenceCase("nessun file caricato")}</h3>
        <p className="text-muted-foreground">{toSentenceCase("inizia caricando il tuo primo file multimediale")}</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {media.map((item) => (
        <Card key={item.id} className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="text-primary">{getIcon(item.file_type)}</div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => window.open(item.file_url, '_blank')}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <h4 className="font-semibold truncate mb-2">{item.filename}</h4>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
