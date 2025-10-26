import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Trash2, Plus } from "lucide-react";
import {
  useOutOfOfficeBlocksQuery,
  useCreateOutOfOfficeBlock,
  useDeleteOutOfOfficeBlock,
} from "../hooks/useOutOfOffice";
import type { CreateOutOfOfficeBlockInput } from "../types";

export function OutOfOfficeManager() {
  const { data: blocks = [], isLoading } = useOutOfOfficeBlocksQuery();
  const createMutation = useCreateOutOfOfficeBlock();
  const deleteMutation = useDeleteOutOfOfficeBlock();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateOutOfOfficeBlockInput>({
    start_at: "",
    end_at: "",
    reason: "",
  });

  const handleCreate = async () => {
    await createMutation.mutateAsync(formData);
    setDialogOpen(false);
    setFormData({ start_at: "", end_at: "", reason: "" });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo periodo fuori ufficio?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Caricamento periodi fuori ufficio...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Gestisci i periodi in cui non sarai disponibile per le prenotazioni
        </p>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi periodo
        </Button>
      </div>

      {blocks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Nessun periodo fuori ufficio impostato
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {blocks.map((block) => (
            <Card key={block.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(block.start_at), "dd MMM yyyy", { locale: it })} -{" "}
                        {format(new Date(block.end_at), "dd MMM yyyy", { locale: it })}
                      </span>
                    </div>
                    {block.reason && (
                      <p className="text-sm text-muted-foreground">{block.reason}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(block.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi periodo fuori ufficio</DialogTitle>
            <DialogDescription>
              Imposta un periodo in cui non sarai disponibile per le prenotazioni
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start">Data inizio</Label>
              <Input
                id="start"
                type="datetime-local"
                value={formData.start_at}
                onChange={(e) =>
                  setFormData({ ...formData, start_at: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end">Data fine</Label>
              <Input
                id="end"
                type="datetime-local"
                value={formData.end_at}
                onChange={(e) =>
                  setFormData({ ...formData, end_at: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opzionale)</Label>
              <Textarea
                id="reason"
                value={formData.reason || ""}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Es: Vacanze, Conferenza..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Annulla
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !formData.start_at ||
                !formData.end_at ||
                createMutation.isPending
              }
            >
              {createMutation.isPending ? "Creazione..." : "Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
