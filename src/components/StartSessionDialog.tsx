import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight } from "lucide-react";
import { useClientPlansQuery } from "@/features/client-plans/hooks/useClientPlansQuery";
import { useCreateSession } from "@/features/sessions/hooks/useCreateSession";
import { useSessionStore } from "@/stores/useSessionStore";
import { toast } from "sonner";
import type { Day } from "@/types/plan";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StartSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  eventId: string;
}

export function StartSessionDialog({
  open,
  onOpenChange,
  clientId,
  eventId,
}: StartSessionDialogProps) {
  const navigate = useNavigate();
  const { activeSession, clearActiveSession } = useSessionStore();
  const createSession = useCreateSession();
  
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingSessionData, setPendingSessionData] = useState<any>(null);

  const { data: plans = [] } = useClientPlansQuery(clientId);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedPlanId(null);
    }
  }, [open]);

  const activePlans = plans.filter((plan) => plan.status === "IN_CORSO");

  const handleStartSession = async (planId: string, dayId: string) => {
    const sessionData = {
      client_id: clientId,
      plan_id: planId,
      day_id: dayId,
      event_id: eventId,
    };

    // Check if there's already an active session
    if (activeSession) {
      setPendingSessionData(sessionData);
      setShowConflictDialog(true);
      return;
    }

    await createSessionAndNavigate(sessionData);
  };

  const createSessionAndNavigate = async (sessionData: any) => {
    try {
      const session = await createSession.mutateAsync(sessionData);
      toast.success("Sessione avviata");
      onOpenChange(false);
      navigate(`/session/live?sessionId=${session.id}`);
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  const handleConflictResolve = async (action: "return" | "terminate") => {
    if (action === "return") {
      setShowConflictDialog(false);
      onOpenChange(false);
      if (activeSession) {
        navigate(`/session/live?sessionId=${activeSession.id}`);
      }
    } else {
      // Terminate current session and start new one
      clearActiveSession();
      setShowConflictDialog(false);
      if (pendingSessionData) {
        await createSessionAndNavigate(pendingSessionData);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Seleziona piano e giorno</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {activePlans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nessun piano attivo per questo cliente
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {activePlans.map((plan) => {
                    const planData = plan.data as { days?: Day[] } | undefined;
                    const planDays = planData?.days || [];
                    const isExpanded = selectedPlanId === plan.id;

                    return (
                      <div
                        key={plan.id}
                        className="border rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setSelectedPlanId(isExpanded ? null : plan.id)
                          }
                          className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors"
                        >
                          <div className="text-left">
                            <p className="font-medium">{plan.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {planDays.length} giorni
                            </p>
                          </div>
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="border-t p-2 space-y-1">
                            {planDays.map((day) => (
                              <button
                                key={day.id}
                                onClick={() =>
                                  handleStartSession(plan.id, day.id)
                                }
                                className="w-full flex items-center justify-between p-3 rounded hover:bg-muted transition-colors text-left"
                              >
                                <span className="font-medium">{day.title}</span>
                                <Button size="sm" variant="default">
                                  Inizia
                                </Button>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sessione già in corso</AlertDialogTitle>
            <AlertDialogDescription>
              Hai già una sessione in corso con {activeSession?.client_name}.
              <br />
              Cosa vuoi fare?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleConflictResolve("return")}>
              🔁 Tornare alla sessione
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleConflictResolve("terminate")}>
              🔚 Terminarla e avviarne una nuova
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
