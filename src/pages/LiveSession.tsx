import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Play, Pause, Save, MoreVertical, XCircle, PauseCircle } from "lucide-react";
import { toast } from "sonner";
import { useSessionQuery } from "@/features/sessions/hooks/useSessionQuery";
import { useUpdateSession } from "@/features/sessions/hooks/useUpdateSession";
import { useActualsQuery } from "@/features/sessions/hooks/useActualsQuery";
import { useCreateActual } from "@/features/sessions/hooks/useCreateActual";
import { useDeleteActual } from "@/features/sessions/hooks/useDeleteActual";
import { getClientPlan } from "@/features/client-plans/api/client-plans.api";
import { updateEvent } from "@/features/events/api/events.api";
import { ExerciseHistoryDrawer } from "@/features/sessions/components/ExerciseHistoryDrawer";
import type { Day, Phase, ExerciseGroup, Exercise } from "@/types/plan";
import type { ExerciseActual } from "@/features/sessions/types";
import { migratePhaseToGroups } from "@/types/plan";

export default function LiveSession() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("sessionId");

  const { data: session, isLoading: sessionLoading } = useSessionQuery(sessionId || undefined);
  const { data: actuals = [] } = useActualsQuery(sessionId || undefined);
  const updateSession = useUpdateSession();
  const createActual = useCreateActual(sessionId || "");
  const deleteActual = useDeleteActual(sessionId || "");

  const [day, setDay] = useState<Day | null>(null);
  const [planName, setPlanName] = useState("");
  const [timerRunning, setTimerRunning] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [restTimers, setRestTimers] = useState<Record<string, number>>({});
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyDrawerExercise, setHistoryDrawerExercise] = useState<{ id: string; name: string } | null>(null);

  // Load day data from plan
  useEffect(() => {
    if (session?.plan_id && session?.day_id) {
      getClientPlan(session.plan_id)
        .then((plan) => {
          setPlanName(plan.name);
          const foundDay = plan.data?.days?.find((d: Day) => d.id === session.day_id);
          if (foundDay) {
            // Migrate phases to use groups
            const migratedDay = {
              ...foundDay,
              phases: foundDay.phases.map(migratePhaseToGroups),
            };
            setDay(migratedDay);
          }
        })
        .catch((error) => {
          toast.error("Errore nel caricamento del piano");
          console.error(error);
        });
    }
  }, [session]);

  // Session timer
  useEffect(() => {
    if (!timerRunning) return;
    const startTime = session?.started_at ? new Date(session.started_at).getTime() : Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, session]);

  // Rest timers
  useEffect(() => {
    const interval = setInterval(() => {
      setRestTimers((prev) => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach((key) => {
          if (next[key] > 0) {
            next[key]--;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  };

  const parseRestToSeconds = (rest?: string) => {
    if (!rest) return 0;
    const match = rest.match(/(\d+)(?::(\d+))?/);
    if (!match) return 0;
    const mins = parseInt(match[1], 10) || 0;
    const secs = parseInt(match[2], 10) || 0;
    return mins * 60 + secs;
  };

  const handleCompleteSet = async (exercise: Exercise, phase: Phase, group: ExerciseGroup) => {
    if (!session || !day) return;
    
    const exerciseActuals = actuals.filter((a) => a.exercise_id === exercise.id);
    const setIndex = exerciseActuals.length + 1;

    try {
      await createActual.mutateAsync({
        day_id: day.id,
        section_id: phase.id,
        group_id: group.id,
        exercise_id: exercise.id,
        set_index: setIndex,
        reps: exercise.reps,
        load: exercise.load,
        rest: exercise.rest,
      });

      // Start rest timer if applicable
      const restSeconds = parseRestToSeconds(exercise.rest);
      if (restSeconds > 0) {
        setRestTimers((prev) => ({ ...prev, [exercise.id]: restSeconds }));
      }

      toast.success("Serie completata");
    } catch (error) {
      toast.error("Errore nel salvare la serie");
    }
  };

  const handleUndoLastSet = async (exerciseId: string) => {
    const exerciseActuals = actuals.filter((a) => a.exercise_id === exerciseId);
    const lastActual = exerciseActuals[exerciseActuals.length - 1];
    if (!lastActual) return;

    try {
      await deleteActual.mutateAsync(lastActual.id);
      toast.success("Ultima serie annullata");
    } catch (error) {
      toast.error("Errore nell'annullare la serie");
    }
  };

  const handleFinishSession = () => {
    setSessionNotes(session?.notes || "");
    setReviewOpen(true);
  };

  const handleSaveSession = async () => {
    if (!session) return;

    try {
      await updateSession.mutateAsync({
        id: session.id,
        updates: {
          status: "completed",
          ended_at: new Date().toISOString(),
          notes: sessionNotes,
        },
      });

      // Mark event as done if linked
      if (session.event_id) {
        try {
          await updateEvent(session.event_id, { session_status: "done" });
        } catch (error) {
          console.error("Error updating event:", error);
        }
      }

      toast.success("Sessione salvata");
      navigate(`/clients/${session.client_id}?tab=sessions`);
    } catch (error) {
      toast.error("Errore nel salvare la sessione");
    }
  };

  const handleInterruptSession = async () => {
    try {
      await updateSession.mutateAsync({
        id: sessionId!,
        updates: { status: "interrupted" },
      });
      toast.success("Sessione interrotta");
      navigate(`/clients/${session.client_id}?tab=sessions`);
    } catch (error) {
      toast.error("Errore nell'interrompere la sessione");
    }
  };

  const handleCancelSession = async () => {
    try {
      await updateSession.mutateAsync({
        id: sessionId!,
        updates: { status: "cancelled" },
      });
      toast.success("Sessione annullata");
      navigate(`/clients/${session.client_id}?tab=sessions`);
    } catch (error) {
      toast.error("Errore nell'annullare la sessione");
    }
  };

  if (sessionLoading || !session || !day) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const getActualsForExercise = (exerciseId: string) =>
    actuals.filter((a) => a.exercise_id === exerciseId);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="truncate">
                <h1 className="text-h5 font-semibold">{session.client_name}</h1>
                <p className="text-sm text-muted-foreground">
                  {planName} · Giorno {day.order} — {day.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTimerRunning(!timerRunning)}
              >
                {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <div className="text-sm font-mono">{formatTime(elapsed)}</div>
              <Button onClick={handleFinishSession} size="sm" className="gap-2">
                <Save className="h-4 w-4" />
                Fine sessione
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleInterruptSession}>
                    <PauseCircle className="h-4 w-4 mr-2" />
                    Interrompi sessione
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setCancelDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Annulla sessione
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-6 max-w-6xl space-y-6">
        {day.phases.map((phase) => {
          const migratedPhase = migratePhaseToGroups(phase);
          if (migratedPhase.groups.length === 0) return null;

          return (
            <div key={phase.id} className="space-y-4">
              <h2 className="text-lg font-semibold">{phase.type}</h2>
              {migratedPhase.groups.map((group) => (
                <div key={group.id} className="border rounded-lg p-4 space-y-3">
                  {group.type !== "single" && group.name && (
                    <div className="font-medium text-sm text-muted-foreground">
                      {group.name}
                    </div>
                  )}
                  {group.exercises.map((exercise) => {
                    const exerciseActuals = getActualsForExercise(exercise.id);
                    const restTimer = restTimers[exercise.id] || 0;

                    return (
                      <div key={exercise.id} className="border-l-4 border-primary/20 pl-3 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{exercise.name || "Esercizio senza nome"}</p>
                            <p className="text-sm text-muted-foreground">
                              {exercise.sets} x {exercise.reps}
                              {exercise.load && ` @ ${exercise.load}`}
                              {exercise.rest && ` · Recupero: ${exercise.rest}`}
                            </p>
                            {exercise.goal && (
                              <p className="text-sm text-muted-foreground italic mt-1">
                                {exercise.goal}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setHistoryDrawerExercise({ id: exercise.id, name: exercise.name });
                                setHistoryDrawerOpen(true);
                              }}
                            >
                              Storico
                            </Button>
                            <div className="text-sm font-medium">
                              {exerciseActuals.length}/{exercise.sets}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleCompleteSet(exercise, phase, group)}
                              disabled={exerciseActuals.length >= exercise.sets}
                            >
                              Completa
                            </Button>
                            {exerciseActuals.length > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUndoLastSet(exercise.id)}
                              >
                                Annulla
                              </Button>
                            )}
                          </div>
                        </div>
                        {restTimer > 0 && (
                          <div className="text-sm font-medium text-primary">
                            Recupero: {formatTime(restTimer)}
                          </div>
                        )}
                        {exerciseActuals.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Serie: {exerciseActuals.map((a) => `${a.reps}`).join(", ")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rivedi e salva</DialogTitle>
            <DialogDescription>
              Rivedi i dettagli della sessione prima di salvare
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Durata</p>
              <p className="text-2xl font-semibold">{formatTime(elapsed)}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Serie totali</p>
              <p className="text-2xl font-semibold">{actuals.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Note sessione</p>
              <Textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Aggiungi note sulla sessione..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>
              Continua sessione
            </Button>
            <Button onClick={handleSaveSession} disabled={updateSession.isPending}>
              Salva sessione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exercise History Drawer */}
      {historyDrawerExercise && session && (
        <ExerciseHistoryDrawer
          open={historyDrawerOpen}
          onOpenChange={setHistoryDrawerOpen}
          clientId={session.client_id}
          exerciseId={historyDrawerExercise.id}
          exerciseName={historyDrawerExercise.name}
        />
      )}

      {/* Cancel Session Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annullare la sessione?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione è irreversibile. La sessione verrà contrassegnata come annullata
              e tutti i dati registrati saranno conservati ma la sessione non sarà più modificabile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Torna indietro</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Annulla sessione
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
