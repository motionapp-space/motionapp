import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTopbar } from "@/contexts/TopbarContext";
import { toast } from "sonner";
import { useSessionQuery } from "@/features/sessions/hooks/useSessionQuery";
import { useUpdateSession } from "@/features/sessions/hooks/useUpdateSession";
import { useActualsQuery } from "@/features/sessions/hooks/useActualsQuery";
import { useCreateActual } from "@/features/sessions/hooks/useCreateActual";
import { useDeleteActual } from "@/features/sessions/hooks/useDeleteActual";
import { getClientPlan } from "@/features/client-plans/api/client-plans.api";
import { ExerciseHistoryDrawer } from "@/features/sessions/components/ExerciseHistoryDrawer";
import { LegendBottomSheet } from "@/features/sessions/components/LegendBottomSheet";
import { ExerciseCard } from "@/features/sessions/components/ExerciseCard";
import { getClientIdFromCoachClient } from "@/lib/coach-client";
import type { Day, Phase, ExerciseGroup, Exercise } from "@/types/plan";
import { migratePhaseToGroups } from "@/types/plan";
import { useSessionStore } from "@/stores/useSessionStore";

export default function LiveSession() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("sessionId");

  const { data: session, isLoading: sessionLoading } = useSessionQuery(sessionId || undefined);
  const { data: actuals = [] } = useActualsQuery(sessionId || undefined);
  const updateSession = useUpdateSession();
  const createActual = useCreateActual(sessionId || "");
  const deleteActual = useDeleteActual(sessionId || "");
  const { getElapsedSeconds } = useSessionStore();

  const [day, setDay] = useState<Day | null>(null);
  const [planName, setPlanName] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [restTimers, setRestTimers] = useState<Record<string, number>>({});
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyDrawerExercise, setHistoryDrawerExercise] = useState<{ id: string; name: string } | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [resolvedClientId, setResolvedClientId] = useState<string | null>(null);
  
  // State for editable values per exercise
  const [editableValues, setEditableValues] = useState<Record<string, {
    reps: string;
    load: string;
    rest: string;
  }>>({});
  
  // State for skipped exercises
  const [skippedExercises, setSkippedExercises] = useState<Set<string>>(new Set());

  // Listen for finish-session event from StickySessionBar
  useEffect(() => {
    const handleFinishSession = () => {
      handleFinishSessionClick();
    };
    window.addEventListener('finish-session', handleFinishSession);
    return () => window.removeEventListener('finish-session', handleFinishSession);
  }, [session]);

  // Load day data from plan
  useEffect(() => {
    if (session?.plan_id && session?.day_id) {
      getClientPlan(session.plan_id)
        .then((plan) => {
          setPlanName(plan.name);
          const foundDay = plan.data?.days?.find((d: Day) => d.id === session.day_id);
          if (foundDay) {
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

  // Resolve client_id from coach_client_id
  useEffect(() => {
    if (session?.coach_client_id) {
      getClientIdFromCoachClient(session.coach_client_id)
        .then(setResolvedClientId)
        .catch(console.error);
    }
  }, [session?.coach_client_id]);

  // Session timer - sync with store
  useEffect(() => {
    if (!session?.started_at) return;
    const updateElapsed = () => setElapsed(getElapsedSeconds());
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [session?.started_at, getElapsedSeconds]);

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

  const getEditableValue = (exerciseId: string, field: 'reps' | 'load' | 'rest', defaultValue: string) => {
    return editableValues[exerciseId]?.[field] ?? defaultValue;
  };

  const updateEditableValue = (exerciseId: string, field: 'reps' | 'load' | 'rest', value: string) => {
    setEditableValues(prev => ({
      ...prev,
      [exerciseId]: {
        reps: prev[exerciseId]?.reps ?? '',
        load: prev[exerciseId]?.load ?? '',
        rest: prev[exerciseId]?.rest ?? '',
        [field]: value
      }
    }));
  };

  const handleSkipExercise = (exerciseId: string) => {
    setSkippedExercises(prev => new Set([...prev, exerciseId]));
  };

  const handleResumeExercise = (exerciseId: string) => {
    setSkippedExercises(prev => {
      const newSet = new Set(prev);
      newSet.delete(exerciseId);
      return newSet;
    });
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
        reps: editableValues[exercise.id]?.reps || exercise.reps,
        load: editableValues[exercise.id]?.load || exercise.load || null,
        rest: editableValues[exercise.id]?.rest || exercise.rest || null,
      });

      // Reset editable values for next set
      setEditableValues(prev => {
        const newValues = { ...prev };
        delete newValues[exercise.id];
        return newValues;
      });

      // Start rest timer if applicable
      const restValue = editableValues[exercise.id]?.rest || exercise.rest;
      const restSeconds = parseRestToSeconds(restValue);
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

  const handleFinishSessionClick = () => {
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

      toast.success("Sessione salvata");
      if (resolvedClientId) navigate(`/clients/${resolvedClientId}?tab=sessions`);
    } catch (error) {
      toast.error("Errore nel salvare la sessione");
    }
  };

  const handleCancelSession = async () => {
    try {
      await updateSession.mutateAsync({
        id: sessionId!,
        updates: { status: "cancelled" },
      });
      toast.success("Sessione annullata");
      if (resolvedClientId) navigate(`/clients/${resolvedClientId}?tab=sessions`);
    } catch (error) {
      toast.error("Errore nell'annullare la sessione");
    }
  };

  // Configure global topbar
  useTopbar({
    title: session?.client_name || "",
    subtitle: day ? `${planName} · Giorno ${day.order}` : "",
    showBack: true,
    onBack: () => navigate(resolvedClientId ? `/clients/${resolvedClientId}?tab=sessions` : "/"),
    showLegendIcon: true,
    onLegendClick: () => setLegendOpen(true),
  });

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
      {/* Content */}
      <div className="max-w-[960px] mx-auto px-4 pt-5 pb-24">

        {/* Exercise sections */}
        {day.phases.map((phase) => {
          const migratedPhase = migratePhaseToGroups(phase);
          if (migratedPhase.groups.length === 0) return null;

          // Translate phase types to Italian
          const phaseLabel = (() => {
            const type = phase.type.toLowerCase();
            if (type === "warm-up" || type === "warmup") return "Riscaldamento";
            if (type === "main workout" || type === "main") return "Corpo principale";
            return phase.type; // Keep as-is for Stretching, etc.
          })();

          return (
            <div key={phase.id}>
              <h2 className="text-[16px] font-semibold mb-3 mt-6">{phaseLabel}</h2>
              
              {migratedPhase.groups.map((group) => {
                const isSuperset = group.type === "superset";
                const isCircuit = group.type === "circuit";
                const hasGroupWrapper = isSuperset || isCircuit;

                const exerciseCards = group.exercises.map((exercise) => {
                  const exerciseActuals = getActualsForExercise(exercise.id);
                  const restTimer = restTimers[exercise.id] || 0;
                  const isSkipped = skippedExercises.has(exercise.id);

                  return (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      actuals={exerciseActuals}
                      restTimer={restTimer}
                      isSkipped={isSkipped}
                      editableValues={{
                        reps: getEditableValue(exercise.id, 'reps', exercise.reps),
                        load: getEditableValue(exercise.id, 'load', exercise.load || ''),
                        rest: getEditableValue(exercise.id, 'rest', exercise.rest || ''),
                      }}
                      onValueChange={(field, value) => updateEditableValue(exercise.id, field, value)}
                      onCompleteSet={() => handleCompleteSet(exercise, migratedPhase, group)}
                      onUndoLastSet={() => handleUndoLastSet(exercise.id)}
                      onSkip={() => handleSkipExercise(exercise.id)}
                      onResume={() => handleResumeExercise(exercise.id)}
                      onOpenHistory={() => {
                        setHistoryDrawerExercise({ id: exercise.id, name: exercise.name });
                        setHistoryDrawerOpen(true);
                      }}
                    />
                  );
                });

                if (hasGroupWrapper) {
                  return (
                    <div
                      key={group.id}
                      className="relative mt-3 mb-4 pl-[14px]"
                    >
                      {/* Vertical rail */}
                      <div className="absolute left-0 top-[28px] bottom-[8px] w-[2px] rounded-full bg-primary/35" />
                      
                      {/* Group label row */}
                      <div className="h-6 flex items-center gap-2 mb-[10px]">
                        <span className="h-6 px-[10px] rounded-full text-[12px] font-semibold text-primary bg-primary/10 inline-flex items-center">
                          {isSuperset ? "Superset" : "Circuito"}{group.name ? ` ${group.name}` : ""}
                        </span>
                        {(group.sharedRestBetweenExercises || group.restBetweenRounds) && (
                          <span className="text-[12px] text-muted-foreground">
                            Recupero dopo completamento
                          </span>
                        )}
                      </div>
                      
                      {/* Exercise cards with reduced gap */}
                      <div className="space-y-3">
                        {exerciseCards}
                      </div>
                    </div>
                  );
                }

                return <div key={group.id} className="space-y-4 mb-4">{exerciseCards}</div>;
              })}
            </div>
          );
        })}
      </div>

      {/* Review dialog */}
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
          clientId={resolvedClientId || ''}
          exerciseId={historyDrawerExercise.id}
          exerciseName={historyDrawerExercise.name}
          currentSessionId={sessionId || undefined}
        />
      )}

      {/* Legend Bottom Sheet */}
      <LegendBottomSheet open={legendOpen} onOpenChange={setLegendOpen} />

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
