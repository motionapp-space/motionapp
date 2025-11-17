import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Pencil } from "lucide-react";
import {
  useOutOfOfficeBlocksQuery,
  useCreateOutOfOfficeBlock,
  useDeleteOutOfOfficeBlock,
  useUpdateOutOfOfficeBlock,
} from "../hooks/useOutOfOffice";
import type { CreateOutOfOfficeBlockInput, OutOfOfficeBlock } from "../types";

interface OutOfOfficeManagerProps {
  onChangeDetected?: () => void;
}

export function OutOfOfficeManager({ onChangeDetected }: OutOfOfficeManagerProps) {
  const { data: blocks = [], isLoading } = useOutOfOfficeBlocksQuery();
  const createMutation = useCreateOutOfOfficeBlock();
  const deleteMutation = useDeleteOutOfOfficeBlock();
  const updateMutation = useUpdateOutOfOfficeBlock();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateOutOfOfficeBlockInput>({
    start_at: "",
    end_at: "",
    reason: "",
    is_all_day: false,
  });

  const handleCreate = async () => {
    await createMutation.mutateAsync(formData);
    setIsAdding(false);
    setFormData({ start_at: "", end_at: "", reason: "", is_all_day: false });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo periodo di assenza?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const startEdit = (block: OutOfOfficeBlock) => {
    setEditingId(block.id);
    setFormData({
      start_at: block.start_at,
      end_at: block.end_at,
      reason: block.reason || "",
      is_all_day: block.is_all_day,
    });
    onChangeDetected?.();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ start_at: "", end_at: "", reason: "", is_all_day: false });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    await updateMutation.mutateAsync({
      id: editingId,
      input: formData,
    });
    setEditingId(null);
    setFormData({ start_at: "", end_at: "", reason: "", is_all_day: false });
  };

  const formatDisplayDate = (dateStr: string, isAllDay: boolean) => {
    if (isAllDay) {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: it });
    }
    return format(new Date(dateStr), "dd/MM/yyyy, HH:mm", { locale: it });
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Caricamento periodi di assenza...</div>;
  }

  return (
    <div className="space-y-3">
      {blocks.length === 0 && !isAdding ? (
        <div className="border rounded-lg p-6 text-center text-sm text-muted-foreground">
          Nessun periodo di assenza impostato
        </div>
      ) : (
        <div className="space-y-2">
          {blocks.map((block) => (
            <div key={block.id} className="border rounded-lg p-3">
              {editingId === block.id ? (
                <div className="space-y-3">
                  {/* Date pickers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Data inizio</Label>
                      {formData.is_all_day ? (
                        <DatePicker
                          value={formData.start_at ? format(new Date(formData.start_at), "yyyy-MM-dd") : ""}
                          onChange={(value) => {
                            if (!value) {
                              setFormData({ ...formData, start_at: "" });
                            } else {
                              const date = new Date(value);
                              date.setHours(0, 0, 0, 0);
                              setFormData({ ...formData, start_at: date.toISOString() });
                            }
                            onChangeDetected?.();
                          }}
                          placeholder="Seleziona data inizio"
                        />
                      ) : (
                        <DateTimePicker
                          value={formData.start_at}
                          onChange={(value) => {
                            setFormData({ ...formData, start_at: value });
                            onChangeDetected?.();
                          }}
                          placeholder="Seleziona data e ora inizio"
                        />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Data fine</Label>
                      {formData.is_all_day ? (
                        <DatePicker
                          value={formData.end_at ? format(new Date(formData.end_at), "yyyy-MM-dd") : ""}
                          onChange={(value) => {
                            if (!value) {
                              setFormData({ ...formData, end_at: "" });
                            } else {
                              const date = new Date(value);
                              date.setHours(23, 59, 59, 999);
                              setFormData({ ...formData, end_at: date.toISOString() });
                            }
                            onChangeDetected?.();
                          }}
                          placeholder="Seleziona data fine"
                        />
                      ) : (
                        <DateTimePicker
                          value={formData.end_at}
                          onChange={(value) => {
                            setFormData({ ...formData, end_at: value });
                            onChangeDetected?.();
                          }}
                          placeholder="Seleziona data e ora fine"
                        />
                      )}
                    </div>
                  </div>

                  {/* Checkbox Tutto il giorno */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-all-day-${block.id}`}
                      checked={formData.is_all_day}
                      onCheckedChange={(checked) => {
                        setFormData({ ...formData, is_all_day: checked === true });
                        onChangeDetected?.();
                      }}
                    />
                    <Label htmlFor={`edit-all-day-${block.id}`} className="text-sm font-medium cursor-pointer">
                      Tutto il giorno
                    </Label>
                  </div>

                  {/* Motivo */}
                  <div className="space-y-1.5">
                    <Label htmlFor={`edit-reason-${block.id}`} className="text-sm font-medium">
                      Motivo (facoltativo)
                    </Label>
                    <Textarea
                      id={`edit-reason-${block.id}`}
                      value={formData.reason || ""}
                      onChange={(e) => {
                        setFormData({ ...formData, reason: e.target.value });
                        onChangeDetected?.();
                      }}
                      placeholder="Inserisci il motivo dell'assenza"
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleUpdate} 
                      disabled={!formData.start_at || !formData.end_at || updateMutation.isPending}
                    >
                      Salva
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                      Annulla
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {formatDisplayDate(block.start_at, block.is_all_day)} – {formatDisplayDate(block.end_at, block.is_all_day)}
                    </div>
                    {block.is_all_day && (
                      <span className="text-xs text-muted-foreground">Tutto il giorno</span>
                    )}
                    {block.reason && <p className="text-sm text-muted-foreground mt-1 truncate">{block.reason}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(block)}>
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
            </div>
          ))}
        </div>
      )}

      {isAdding && (
        <div className="border rounded-lg p-3">
          <div className="space-y-3">
            {/* Date pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Data inizio</Label>
                {formData.is_all_day ? (
                  <DatePicker
                    value={formData.start_at ? format(new Date(formData.start_at), "yyyy-MM-dd") : ""}
                    onChange={(value) => {
                      if (!value) {
                        setFormData({ ...formData, start_at: "" });
                      } else {
                        const date = new Date(value);
                        date.setHours(0, 0, 0, 0);
                        setFormData({ ...formData, start_at: date.toISOString() });
                      }
                      onChangeDetected?.();
                    }}
                    placeholder="Seleziona data inizio"
                  />
                ) : (
                  <DateTimePicker
                    value={formData.start_at}
                    onChange={(value) => {
                      setFormData({ ...formData, start_at: value });
                      onChangeDetected?.();
                    }}
                    placeholder="Seleziona data e ora inizio"
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Data fine</Label>
                {formData.is_all_day ? (
                  <DatePicker
                    value={formData.end_at ? format(new Date(formData.end_at), "yyyy-MM-dd") : ""}
                    onChange={(value) => {
                      if (!value) {
                        setFormData({ ...formData, end_at: "" });
                      } else {
                        const date = new Date(value);
                        date.setHours(23, 59, 59, 999);
                        setFormData({ ...formData, end_at: date.toISOString() });
                      }
                      onChangeDetected?.();
                    }}
                    placeholder="Seleziona data fine"
                  />
                ) : (
                  <DateTimePicker
                    value={formData.end_at}
                    onChange={(value) => {
                      setFormData({ ...formData, end_at: value });
                      onChangeDetected?.();
                    }}
                    placeholder="Seleziona data e ora fine"
                  />
                )}
              </div>
            </div>

            {/* Checkbox Tutto il giorno */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="add-all-day"
                checked={formData.is_all_day}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, is_all_day: checked === true });
                  onChangeDetected?.();
                }}
              />
              <Label htmlFor="add-all-day" className="text-sm font-medium cursor-pointer">
                Tutto il giorno
              </Label>
            </div>

            {/* Motivo */}
            <div className="space-y-1.5">
              <Label htmlFor="add-reason" className="text-sm font-medium">
                Motivo (facoltativo)
              </Label>
              <Textarea
                id="add-reason"
                value={formData.reason || ""}
                onChange={(e) => {
                  setFormData({ ...formData, reason: e.target.value });
                  onChangeDetected?.();
                }}
                placeholder="Inserisci il motivo dell'assenza"
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleCreate} 
                disabled={!formData.start_at || !formData.end_at || createMutation.isPending}
              >
                Crea
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit}>
                Annulla
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isAdding && (
        <Button variant="outline" size="sm" onClick={() => { setIsAdding(true); onChangeDetected?.(); }} className="w-full">
          <Plus className="h-4 w-4 mr-2" />Aggiungi periodo
        </Button>
      )}
    </div>
  );
}
