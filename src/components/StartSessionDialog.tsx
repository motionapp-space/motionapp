import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, FileText } from "lucide-react";
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
  
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingSessionData, setPendingSessionData] = useState<any>(null);

  const { data: plans = [] } = useClientPlansQuery(clientId);

  // Get the active plan (isActiveForClient = true)
  const activePlan = plans.find((plan) => plan.isActiveForClient);

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

  // Get days from active plan
  const planData = activePlan?.data as { days?: Day[] } | undefined;
  const planDays = planData?.days || [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Seleziona giorno</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!activePlan ? (
              // Empty state: no active plan
              <div className="text-center py-8 space-y-4">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <p className="font-medium">Nessun piano in uso</p>
                  <p className="text-sm text-muted-foreground">
                    Imposta un piano in uso per creare una sessione.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/clients/${clientId}?tab=plans`);
                  }}
                >
                  Vai ai piani
                </Button>
              </div>
            ) : planDays.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Il piano non contiene giorni di allenamento
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {/* Show active plan info */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Piano in uso</p>
                    <p className="font-medium">{activePlan.name}</p>
                  </div>
                  
                  {/* Day selection */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-2 space-y-1">
                      {planDays.map((day) => (
                        <button
                          key={day.id}
                          onClick={() => handleStartSession(activePlan.id, day.id)}
                          className="w-full flex items-center justify-between p-3 rounded hover:bg-muted transition-colors text-left"
                        >
                          <span className="font-medium">{day.title}</span>
                          <Button size="sm" variant="default">
                            Inizia
                          </Button>
                        </button>
                      ))}
                    </div>
                  </div>
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
