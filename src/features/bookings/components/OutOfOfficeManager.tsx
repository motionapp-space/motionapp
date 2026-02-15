import { useState, useImperativeHandle, forwardRef, useMemo } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOutOfOfficeBlocksQuery } from "../hooks/useOutOfOffice";
import type { CreateOutOfOfficeBlockInput, OutOfOfficeBlock, UpdateOutOfOfficeBlockInput } from "../types";

export interface PendingOOOChanges {
  creates: CreateOutOfOfficeBlockInput[];
  deletes: string[];
  updates: { id: string; input: UpdateOutOfOfficeBlockInput }[];
}

export interface OutOfOfficeManagerHandle {
  getPendingChanges: () => PendingOOOChanges;
  hasPendingChanges: () => boolean;
  discardChanges: () => void;
}

interface OutOfOfficeManagerProps {
  onChangeDetected?: () => void;
}

export const OutOfOfficeManager = forwardRef<OutOfOfficeManagerHandle, OutOfOfficeManagerProps>(
  ({ onChangeDetected }, ref) => {
    const { data: blocks = [], isLoading } = useOutOfOfficeBlocksQuery();

    // Pending changes state (local, not committed to DB)
    const [pendingCreates, setPendingCreates] = useState<(CreateOutOfOfficeBlockInput & { temp_id: string })[]>([]);
    const [pendingDeletes, setPendingDeletes] = useState<string[]>([]);
    const [pendingUpdates, setPendingUpdates] = useState<{ id: string; input: UpdateOutOfOfficeBlockInput }[]>([]);

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<CreateOutOfOfficeBlockInput>({
      start_at: "",
      end_at: "",
      reason: "",
      is_all_day: false,
    });

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      getPendingChanges: () => ({
        creates: pendingCreates.map(({ temp_id, ...rest }) => rest),
        deletes: pendingDeletes,
        updates: pendingUpdates,
      }),
      hasPendingChanges: () => 
        pendingCreates.length > 0 || pendingDeletes.length > 0 || pendingUpdates.length > 0,
      discardChanges: () => {
        setPendingCreates([]);
        setPendingDeletes([]);
        setPendingUpdates([]);
        setIsAdding(false);
        setEditingId(null);
        setFormData({ start_at: "", end_at: "", reason: "", is_all_day: false });
      },
    }));

    // Compute the "virtual" blocks view: original blocks minus pending deletes, plus pending creates, with pending updates applied
    const visibleBlocks = useMemo(() => {
      // Filter out deleted blocks
      const filtered = blocks.filter(b => !pendingDeletes.includes(b.id));
      
      // Apply pending updates to existing blocks
      const updated = filtered.map(block => {
        const pendingUpdate = pendingUpdates.find(u => u.id === block.id);
        if (pendingUpdate) {
          return {
            ...block,
            ...pendingUpdate.input,
          };
        }
        return block;
      });

      // Add pending creates as virtual blocks
      const virtualCreates: OutOfOfficeBlock[] = pendingCreates.map(pc => ({
        id: pc.temp_id,
        coach_id: "",
        start_at: pc.start_at,
        end_at: pc.end_at,
        reason: pc.reason,
        is_all_day: pc.is_all_day ?? false,
        is_recurring: false,
        created_at: new Date().toISOString(),
      }));

      return [...updated, ...virtualCreates];
    }, [blocks, pendingCreates, pendingDeletes, pendingUpdates]);

    const handleCreate = () => {
      // Add to pending creates with a temp_id
      const newItem = {
        ...formData,
        temp_id: `temp_${Date.now()}`,
      };
      setPendingCreates(prev => [...prev, newItem]);
      setIsAdding(false);
      setFormData({ start_at: "", end_at: "", reason: "", is_all_day: false });
      onChangeDetected?.();
    };

    const handleDelete = (id: string) => {
      // Check if it's a pending create (temp id)
      if (id.startsWith("temp_")) {
        setPendingCreates(prev => prev.filter(p => p.temp_id !== id));
      } else {
        // Mark for deletion
        setPendingDeletes(prev => [...prev, id]);
        // Remove from pending updates if exists
        setPendingUpdates(prev => prev.filter(u => u.id !== id));
      }
      onChangeDetected?.();
    };

    const startEdit = (block: OutOfOfficeBlock) => {
      setEditingId(block.id);
      setFormData({
        start_at: block.start_at,
        end_at: block.end_at,
        reason: block.reason || "",
        is_all_day: block.is_all_day,
      });
    };

    const cancelEdit = () => {
      setEditingId(null);
      setIsAdding(false);
      setFormData({ start_at: "", end_at: "", reason: "", is_all_day: false });
    };

    const handleUpdate = () => {
      if (!editingId) return;

      // Check if it's a pending create (temp id)
      if (editingId.startsWith("temp_")) {
        setPendingCreates(prev => prev.map(p => 
          p.temp_id === editingId 
            ? { ...p, ...formData }
            : p
        ));
      } else {
        // Check if already in pending updates
        const existingIndex = pendingUpdates.findIndex(u => u.id === editingId);
        if (existingIndex >= 0) {
          setPendingUpdates(prev => prev.map((u, i) => 
            i === existingIndex 
              ? { ...u, input: { ...u.input, ...formData } }
              : u
          ));
        } else {
          setPendingUpdates(prev => [...prev, { id: editingId, input: formData }]);
        }
      }

      setEditingId(null);
      setFormData({ start_at: "", end_at: "", reason: "", is_all_day: false });
      onChangeDetected?.();
    };

    const formatDisplayDate = (dateStr: string, isAllDay: boolean) => {
      if (isAllDay) {
        return format(new Date(dateStr), "dd/MM/yyyy", { locale: it });
      }
      return format(new Date(dateStr), "dd/MM/yyyy, HH:mm", { locale: it });
    };

    const isEndBeforeStart = (start: string, end: string): boolean => {
      if (!start || !end) return false;
      return new Date(end) < new Date(start);
    };

    if (isLoading) {
      return <div className="text-sm text-muted-foreground">Caricamento periodi di assenza...</div>;
    }

    return (
      <div className="space-y-3">
        {visibleBlocks.length === 0 && !isAdding ? (
          <div className="border rounded-lg p-6 text-center text-sm text-muted-foreground">
            Nessun periodo di assenza impostato
          </div>
        ) : (
          <div className="space-y-2">
            {visibleBlocks.map((block) => (
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
                            }}
                            placeholder="Seleziona data inizio"
                          />
                        ) : (
                          <DateTimePicker
                            value={formData.start_at}
                            onChange={(value) => {
                              setFormData({ ...formData, start_at: value });
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
                            }}
                            placeholder="Seleziona data fine"
                            className={cn(
                              isEndBeforeStart(formData.start_at, formData.end_at) && "border-destructive focus-visible:ring-destructive"
                            )}
                          />
                        ) : (
                          <DateTimePicker
                            value={formData.end_at}
                            onChange={(value) => {
                              setFormData({ ...formData, end_at: value });
                            }}
                            placeholder="Seleziona data e ora fine"
                            className={cn(
                              isEndBeforeStart(formData.start_at, formData.end_at) && "border-destructive focus-visible:ring-destructive"
                            )}
                          />
                        )}
                        {isEndBeforeStart(formData.start_at, formData.end_at) && (
                          <p className="text-xs text-destructive mt-1">La data di fine deve essere successiva alla data di inizio</p>
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
                        disabled={!formData.start_at || !formData.end_at || isEndBeforeStart(formData.start_at, formData.end_at)}
                      >
                        OK
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Annulla
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {formatDisplayDate(block.start_at, block.is_all_day)} – {formatDisplayDate(block.end_at, block.is_all_day)}
                      </div>
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
                      }}
                      placeholder="Seleziona data inizio"
                    />
                  ) : (
                    <DateTimePicker
                      value={formData.start_at}
                      onChange={(value) => {
                        setFormData({ ...formData, start_at: value });
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
                      }}
                      placeholder="Seleziona data fine"
                      className={cn(
                        isEndBeforeStart(formData.start_at, formData.end_at) && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                  ) : (
                    <DateTimePicker
                      value={formData.end_at}
                      onChange={(value) => {
                        setFormData({ ...formData, end_at: value });
                      }}
                      placeholder="Seleziona data e ora fine"
                      className={cn(
                        isEndBeforeStart(formData.start_at, formData.end_at) && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                  )}
                  {isEndBeforeStart(formData.start_at, formData.end_at) && (
                    <p className="text-xs text-destructive mt-1">La data di fine deve essere successiva alla data di inizio</p>
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
                  disabled={!formData.start_at || !formData.end_at || isEndBeforeStart(formData.start_at, formData.end_at)}
                >
                  Aggiungi
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  Annulla
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isAdding && (
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />Aggiungi periodo
          </Button>
        )}
      </div>
    );
  }
);

OutOfOfficeManager.displayName = "OutOfOfficeManager";
