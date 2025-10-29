import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useClientPlansQuery } from "@/features/client-plans/hooks/useClientPlansQuery";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Day } from "@/types/plan";
import type { ClientPlan } from "@/features/client-plans/types";

interface DayPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  linkedPlanId?: string;
  linkedDayId?: string;
  onConfirm: (planId: string, dayId: string) => void;
}

export function DayPicker({
  open,
  onOpenChange,
  clientId,
  linkedPlanId,
  linkedDayId,
  onConfirm,
}: DayPickerProps) {
  const isMobile = useIsMobile();
  const { data: clientPlans = [] } = useClientPlansQuery(clientId);
  
  const activePlans = clientPlans.filter((p) => p.status === "IN_CORSO");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedDayId, setSelectedDayId] = useState<string>("");

  // Preselect linked plan if available, otherwise pick the first active plan
  useEffect(() => {
    if (activePlans.length > 0) {
      const planToSelect = linkedPlanId && activePlans.find((p) => p.id === linkedPlanId)
        ? linkedPlanId
        : activePlans[0].id;
      setSelectedPlanId(planToSelect);
    }
  }, [activePlans, linkedPlanId]);

  // Get selected plan's days
  const selectedPlan = activePlans.find((p) => p.id === selectedPlanId);
  const days: Day[] = selectedPlan?.data?.days || [];

  // Suggest a day (linked or next in cycle)
  useEffect(() => {
    if (days.length > 0 && !selectedDayId) {
      const suggested = linkedDayId && days.find((d) => d.id === linkedDayId)
        ? linkedDayId
        : days[0].id;
      setSelectedDayId(suggested);
    }
  }, [days, linkedDayId, selectedDayId]);

  const handleConfirm = () => {
    if (selectedPlanId && selectedDayId) {
      onConfirm(selectedPlanId, selectedDayId);
      onOpenChange(false);
    }
  };

  const content = (
    <>
      {activePlans.length === 0 ? (
        <div className="py-8 text-center space-y-4">
          <p className="text-muted-foreground">Nessun piano attivo trovato</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {selectedPlan && (
              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <p className="font-medium">{selectedPlan.name}</p>
                {selectedPlan.description && (
                  <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Seleziona giorno</Label>
              <RadioGroup value={selectedDayId} onValueChange={setSelectedDayId}>
                {days.map((day, index) => {
                  const isSuggested = linkedDayId ? day.id === linkedDayId : index === 0;
                  return (
                    <div key={day.id} className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent cursor-pointer">
                      <RadioGroupItem value={day.id} id={day.id} />
                      <Label htmlFor={day.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Giorno {day.order} — {day.title}</span>
                          {isSuggested && (
                            <Badge variant="secondary" className="text-xs">
                              Suggerito
                            </Badge>
                          )}
                        </div>
                        {day.focusMuscle && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {day.focusMuscle}
                          </p>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          </div>
        </>
      )}
    </>
  );

  const footer = activePlans.length > 0 && (
    <>
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        Annulla
      </Button>
      <Button onClick={handleConfirm} disabled={!selectedDayId}>
        Avvia sessione
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Seleziona giorno</DrawerTitle>
            <DrawerDescription>
              Scegli il giorno da tracciare dal piano attivo del cliente
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">{content}</div>
          {footer && (
            <DrawerFooter className="flex-row gap-2">
              {footer}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Seleziona giorno</DialogTitle>
          <DialogDescription>
            Scegli il giorno da tracciare dal piano attivo del cliente
          </DialogDescription>
        </DialogHeader>
        {content}
        {footer && (
          <DialogFooter>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
