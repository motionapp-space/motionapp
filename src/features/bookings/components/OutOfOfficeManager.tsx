import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Pencil } from "lucide-react";
import {
  useOutOfOfficeBlocksQuery,
  useCreateOutOfOfficeBlock,
  useDeleteOutOfOfficeBlock,
} from "../hooks/useOutOfOffice";
import type { CreateOutOfOfficeBlockInput, OutOfOfficeBlock } from "../types";

export function OutOfOfficeManager() {
  const { data: blocks = [], isLoading } = useOutOfOfficeBlocksQuery();
  const createMutation = useCreateOutOfOfficeBlock();
  const deleteMutation = useDeleteOutOfOfficeBlock();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateOutOfOfficeBlockInput>({
    start_at: "",
    end_at: "",
    reason: "",
  });

  const handleCreate = async () => {
    await createMutation.mutateAsync(formData);
    setIsAdding(false);
    setFormData({ start_at: "", end_at: "", reason: "" });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo periodo fuori ufficio?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const startEdit = (block: OutOfOfficeBlock) => {
    setEditingId(block.id);
    setFormData({
      start_at: block.start_at,
      end_at: block.end_at,
      reason: block.reason || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ start_at: "", end_at: "", reason: "" });
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Caricamento periodi fuori ufficio...</div>;
  }

  return (
    <div className="space-y-3">
      {/* Compact list */}
      {blocks.length === 0 && !isAdding ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nessun periodo fuori ufficio impostato
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {blocks.map((block) => (
            <Card key={block.id}>
              <CardContent className="p-3">
                {editingId === block.id ? (
                  // Inline edit form
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`edit-start-${block.id}`} className="text-xs">
                          Data inizio
                        </Label>
                        <Input
                          id={`edit-start-${block.id}`}
                          type="datetime-local"
                          value={formData.start_at}
                          onChange={(e) =>
                            setFormData({ ...formData, start_at: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`edit-end-${block.id}`} className="text-xs">
                          Data fine
                        </Label>
                        <Input
                          id={`edit-end-${block.id}`}
                          type="datetime-local"
                          value={formData.end_at}
                          onChange={(e) =>
                            setFormData({ ...formData, end_at: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`edit-reason-${block.id}`} className="text-xs">
                        Motivo (opzionale)
                      </Label>
                      <Textarea
                        id={`edit-reason-${block.id}`}
                        value={formData.reason || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, reason: e.target.value })
                        }
                        placeholder="Es: Vacanze, Conferenza..."
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleCreate}
                        disabled={
                          !formData.start_at ||
                          !formData.end_at ||
                          createMutation.isPending
                        }
                      >
                        Salva
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                      >
                        Annulla
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {format(new Date(block.start_at), "dd MMM yyyy", { locale: it })} –{" "}
                        {format(new Date(block.end_at), "dd MMM yyyy", { locale: it })}
                      </div>
                      {block.reason && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {block.reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(block)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(block.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Inline add form */}
      {isAdding && (
        <Card>
          <CardContent className="p-3">
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="add-start" className="text-xs">
                    Data inizio
                  </Label>
                  <Input
                    id="add-start"
                    type="datetime-local"
                    value={formData.start_at}
                    onChange={(e) =>
                      setFormData({ ...formData, start_at: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="add-end" className="text-xs">
                    Data fine
                  </Label>
                  <Input
                    id="add-end"
                    type="datetime-local"
                    value={formData.end_at}
                    onChange={(e) =>
                      setFormData({ ...formData, end_at: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-reason" className="text-xs">
                  Motivo (opzionale)
                </Label>
                <Textarea
                  id="add-reason"
                  value={formData.reason || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="Es: Vacanze, Conferenza..."
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={
                    !formData.start_at ||
                    !formData.end_at ||
                    createMutation.isPending
                  }
                >
                  {createMutation.isPending ? "Creazione..." : "Crea"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEdit}
                >
                  Annulla
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add button */}
      {!isAdding && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi periodo
        </Button>
      )}
    </div>
  );
}
