import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Wand2, Save } from "lucide-react";
import type { Plan, Exercise } from "@/types/plan";

interface PlanPreviewEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPlan: Plan | null;
  onConfirm: (plan: Plan) => void;
}

export function PlanPreviewEditorModal({ open, onOpenChange, initialPlan, onConfirm }: PlanPreviewEditorModalProps) {
  const [editedPlan, setEditedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (initialPlan) {
      // Deep copy to allow local mutations
      setEditedPlan(JSON.parse(JSON.stringify(initialPlan)));
    }
  }, [initialPlan]);

  if (!editedPlan || !editedPlan.days) return null;

  const handleExerciseChange = (dayIndex: number, phaseIndex: number, groupIndex: number, exerciseIndex: number, field: keyof Exercise, value: string | number) => {
    setEditedPlan((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      const days = [...next.days];
      const day = { ...days[dayIndex] };
      const phases = [...day.phases];
      const phase = { ...phases[phaseIndex] };
      const groups = [...(phase.groups || [])];
      
      if (groups.length === 0) return prev;
      
      const group = { ...groups[groupIndex] };
      const exercises = [...group.exercises];
      
      exercises[exerciseIndex] = { ...exercises[exerciseIndex], [field]: value };
      
      group.exercises = exercises;
      groups[groupIndex] = group;
      phase.groups = groups;
      phases[phaseIndex] = phase;
      day.phases = phases;
      days[dayIndex] = day;
      next.days = days;
      
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Revisione del Piano AI
          </DialogTitle>
          <DialogDescription>
            Controlla i dati estratti dall'AI. Modifica eventuali inesattezze nelle serie o nelle ripetizioni prima di confermare.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
          <Accordion type="multiple" defaultValue={editedPlan.days.map((_, i) => `day-${i}`)} className="w-full">
            {editedPlan.days.map((day, dIdx) => (
              <AccordionItem key={dIdx} value={`day-${dIdx}`}>
                <AccordionTrigger className="text-lg font-semibold hover:no-underline font-heading">
                  <div className="flex items-center gap-2">
                    {day.title || `Giorno ${dIdx + 1}`}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  {day.phases?.map((phase, pIdx) => (
                    <div key={pIdx} className="border rounded-xl p-4 bg-muted/20">
                      <h4 className="font-medium text-primary mb-4 flex items-center gap-2">
                        {pIdx + 1}. {phase.type}
                      </h4>
                      <div className="space-y-4">
                        {phase.groups?.map((group, gIdx) => (
                          <div key={gIdx} className={`space-y-3 ${group.type !== 'single' ? 'pl-4 border-l-2 border-primary/20' : ''}`}>
                            {group.type !== "single" && (
                              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                {group.type === "superset" ? "Superset" : "Circuito"}
                              </Badge>
                            )}
                            
                            {group.exercises?.map((ex, eIdx) => (
                              <div key={eIdx} className="grid grid-cols-12 gap-3 items-end bg-background p-3 rounded-lg border shadow-sm">
                                <div className="col-span-5 space-y-1">
                                  <Label className="text-xs">Esercizio</Label>
                                  <Input 
                                    value={ex.name || ""} 
                                    onChange={(e) => handleExerciseChange(dIdx, pIdx, gIdx, eIdx, 'name', e.target.value)}
                                  />
                                </div>
                                <div className="col-span-2 space-y-1">
                                  <Label className="text-xs">Serie</Label>
                                  <Input 
                                    type="number" 
                                    value={ex.sets || 0} 
                                    onChange={(e) => handleExerciseChange(dIdx, pIdx, gIdx, eIdx, 'sets', parseInt(e.target.value) || 0)}
                                  />
                                </div>
                                <div className="col-span-2 space-y-1">
                                  <Label className="text-xs">Ripetizioni</Label>
                                  <Input 
                                    value={ex.reps || ""} 
                                    onChange={(e) => handleExerciseChange(dIdx, pIdx, gIdx, eIdx, 'reps', e.target.value)}
                                  />
                                </div>
                                <div className="col-span-3 space-y-1">
                                  <Label className="text-xs">Recupero</Label>
                                  <Input 
                                    value={ex.rest || ""} 
                                    onChange={(e) => handleExerciseChange(dIdx, pIdx, gIdx, eIdx, 'rest', e.target.value)}
                                    placeholder="es. 60s"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <DialogFooter className="mt-4 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button onClick={() => onConfirm(editedPlan)} className="gap-2">
            <Save className="h-4 w-4" />
            Conferma e Salva Piano
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
