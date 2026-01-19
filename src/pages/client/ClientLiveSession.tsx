/**
 * Client Live Session Page
 * 
 * Mobile-first UI for autonomous client workout tracking.
 * Renders exercises from session.plan_day_snapshot.
 * 
 * Features:
 * - Priority rest countdown in header
 * - Superset/circuit as single unit (1 CTA, 1 counter)
 * - Touch-first inputs (h-11, rounded-xl)
 * - Zero toast during live session
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Check, Undo2, Dumbbell, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatElapsedTime } from '@/features/session-tracking/core/elapsed';
import {
  useClientActiveSession,
  useClientSessionDetail,
  useClientSessionActuals,
  useCompleteClientSet,
  useUndoClientLastSet,
  useFinishClientSession,
  useDiscardClientSession,
  useCompleteSupersetSeries,
  useUndoSupersetLastSeries,
} from '@/features/session-tracking/hooks/useClientSessionTracking';
import { useClientSessionStore } from '@/stores/useClientSessionStore';
import type { PlanDaySnapshot, SnapshotExercise, SnapshotPhase, SnapshotGroup } from '@/features/session-tracking/core/types';
import type { ExerciseActual } from '@/features/sessions/types';

// ================== Format Rest Time ==================

function formatRestTime(seconds: number): string {
  const absSeconds = Math.abs(seconds);
  const mins = Math.floor(absSeconds / 60);
  const secs = absSeconds % 60;
  const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return seconds < 0 ? `−${formatted}` : formatted;
}

// ================== Session Header Timer ==================

function SessionHeaderTimer() {
  const store = useClientSessionStore();
  const [, forceUpdate] = useState(0);

  // Update every second
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(n => n + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isRestActive = store.isRestActive();
  const remainingRest = store.getRemainingRestSeconds();
  const elapsed = store.getElapsedSeconds();
  const isOvertime = remainingRest < 0;

  if (isRestActive) {
    return (
      <div className="text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {isOvertime ? 'Recupero superato' : 'Recupero'}
        </p>
        <span className={cn(
          "text-[28px] font-semibold leading-[32px] tabular-nums font-mono",
          isOvertime ? "text-destructive" : "text-primary"
        )}>
          {formatRestTime(remainingRest)}
        </span>
        <p className="text-[13px] text-muted-foreground mt-1">
          Durata: {formatElapsedTime(elapsed)}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2">
        <Timer className="h-5 w-5 text-muted-foreground" />
        <span className="text-[22px] font-semibold tabular-nums font-mono">
          {formatElapsedTime(elapsed)}
        </span>
      </div>
    </div>
  );
}

// ================== Exercise Input Row ==================

interface ExerciseInputRowProps {
  exercise: SnapshotExercise;
  reps: string;
  setReps: (value: string) => void;
  load: string;
  setLoad: (value: string) => void;
}

function ExerciseInputRow({ exercise, reps, setReps, load, setLoad }: ExerciseInputRowProps) {
  return (
    <div className="grid grid-cols-2 gap-3 mt-3">
      <div>
        <Label className="text-[11px] font-medium text-muted-foreground">Reps</Label>
        <Input
          type="text"
          inputMode="numeric"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="h-11 rounded-xl text-[16px] font-medium text-center"
          placeholder={exercise.reps || '10'}
        />
      </div>
      <div>
        <Label className="text-[11px] font-medium text-muted-foreground">Carico</Label>
        <Input
          type="text"
          inputMode="decimal"
          value={load}
          onChange={(e) => setLoad(e.target.value)}
          className="h-11 rounded-xl text-[16px] font-medium text-center"
          placeholder="0 kg"
        />
      </div>
    </div>
  );
}

// ================== Superset Card ==================

interface SupersetCardProps {
  group: SnapshotGroup;
  dayId: string;
  phaseType: string;
  sessionId: string;
  actuals: ExerciseActual[];
  onSeriesComplete: (restSeconds: number, groupId: string) => void;
}

function SupersetCard({
  group,
  dayId,
  phaseType,
  sessionId,
  actuals,
  onSeriesComplete,
}: SupersetCardProps) {
  // State for each exercise's inputs
  const [inputValues, setInputValues] = useState<Record<string, { reps: string; load: string }>>(() => {
    const initial: Record<string, { reps: string; load: string }> = {};
    group.exercises.forEach(ex => {
      initial[ex.id] = { reps: ex.reps || '', load: '' };
    });
    return initial;
  });

  const { mutate: completeSeries, isPending: isCompleting } = useCompleteSupersetSeries(sessionId);
  const { mutate: undoSeries, isPending: isUndoing } = useUndoSupersetLastSeries(sessionId);

  // Robust series counting: Math.floor(groupActuals / numExercises)
  const numExercises = group.exercises.length;
  const groupExerciseIds = group.exercises.map(e => e.id);
  const groupActuals = actuals.filter(a => groupExerciseIds.includes(a.exercise_id));
  const completedSeries = Math.floor(groupActuals.length / numExercises);
  const targetSeries = Math.min(...group.exercises.map(e => e.sets));
  const nextSeriesIndex = completedSeries + 1;

  // Get rest seconds from first exercise (group-level rest)
  const restSeconds = group.exercises[0]?.rest_seconds || 60;

  const handleCompleteSeries = () => {
    // Build inputs for all exercises in the group
    const inputs = group.exercises.map(ex => ({
      day_id: dayId,
      section_id: phaseType,
      group_id: group.id,
      exercise_id: ex.id,
      set_index: nextSeriesIndex,
      reps: inputValues[ex.id]?.reps || ex.reps || '',
      load: inputValues[ex.id]?.load || undefined,
      rest: restSeconds.toString(),
    }));

    completeSeries(inputs, {
      onSuccess: () => {
        onSeriesComplete(restSeconds, group.id);
      },
      onError: (error) => {
        toast.error(error.message || 'Errore nel salvataggio');
      },
    });
  };

  const handleUndoSeries = () => {
    undoSeries(groupExerciseIds, {
      onError: (error) => {
        toast.error(error.message || 'Errore');
      },
    });
  };

  const allSeriesCompleted = completedSeries >= targetSeries;
  const hasCompletedSeries = completedSeries > 0;

  // Check if all reps are filled
  const allRepsFilled = group.exercises.every(ex => 
    inputValues[ex.id]?.reps && inputValues[ex.id].reps.trim() !== ''
  );

  return (
    <div className={cn(
      "bg-background border border-muted rounded-2xl p-4 mb-4",
      allSeriesCompleted && "opacity-60 border-green-500/30"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="h-7 px-3 rounded-full bg-primary/10 text-primary text-[12px] font-medium flex items-center">
            {group.type === 'circuit' ? 'Circuit' : 'Superset'}
          </span>
          {group.label && (
            <span className="text-[12px] text-muted-foreground">{group.label}</span>
          )}
        </div>
        <span className="text-[12px] font-medium bg-muted rounded-full px-3 py-1">
          Serie {completedSeries}/{targetSeries}
        </span>
      </div>

      {/* Exercises */}
      {group.exercises.map((exercise, idx) => (
        <div key={exercise.id} className={cn(idx > 0 && "mt-4")}>
          {/* Exercise name and target */}
          <h4 className="text-[16px] font-semibold leading-[22px]">
            {exercise.name || 'Esercizio'}
          </h4>
          <p className="text-[13px] text-muted-foreground mt-1">
            {exercise.sets} x {exercise.reps}
            {exercise.rest_seconds && ` • ${exercise.rest_seconds}s rec.`}
          </p>

          {/* Inputs */}
          <ExerciseInputRow
            exercise={exercise}
            reps={inputValues[exercise.id]?.reps || ''}
            setReps={(value) => setInputValues(prev => ({
              ...prev,
              [exercise.id]: { ...prev[exercise.id], reps: value }
            }))}
            load={inputValues[exercise.id]?.load || ''}
            setLoad={(value) => setInputValues(prev => ({
              ...prev,
              [exercise.id]: { ...prev[exercise.id], load: value }
            }))}
          />
        </div>
      ))}

      {/* CTA - Single button for entire superset */}
      <Button
        onClick={handleCompleteSeries}
        disabled={isCompleting || !allRepsFilled || allSeriesCompleted}
        className="w-full h-12 rounded-xl text-[16px] font-semibold mt-4"
      >
        {isCompleting ? (
          'Salvataggio...'
        ) : (
          <>
            <Check className="mr-2 h-5 w-5" />
            Completa serie {nextSeriesIndex}
          </>
        )}
      </Button>

      {/* Undo - Link style */}
      {hasCompletedSeries && (
        <button
          onClick={handleUndoSeries}
          disabled={isUndoing}
          className="text-[14px] font-medium text-muted-foreground flex items-center gap-1 mt-3 min-h-[44px]"
        >
          <Undo2 className="h-4 w-4" />
          {isUndoing ? 'Annullo...' : 'Annulla ultima serie'}
        </button>
      )}
    </div>
  );
}

// ================== Single Exercise Card ==================

interface SingleExerciseCardProps {
  exercise: SnapshotExercise;
  group: SnapshotGroup;
  dayId: string;
  phaseType: string;
  sessionId: string;
  actuals: ExerciseActual[];
  onSetComplete: (restSeconds: number, groupId: string) => void;
}

function SingleExerciseCard({
  exercise,
  group,
  dayId,
  phaseType,
  sessionId,
  actuals,
  onSetComplete,
}: SingleExerciseCardProps) {
  const [reps, setReps] = useState(exercise.reps || '');
  const [load, setLoad] = useState('');

  const { mutate: completeSet, isPending: isCompleting } = useCompleteClientSet(sessionId);
  const { mutate: undoLastSet, isPending: isUndoing } = useUndoClientLastSet(sessionId);

  // Filter actuals for this exercise
  const exerciseActuals = actuals.filter(a => a.exercise_id === exercise.id);
  const completedSets = exerciseActuals.length;
  const nextSetIndex = completedSets + 1;
  const restSeconds = exercise.rest_seconds || 60;

  const handleCompleteSet = () => {
    completeSet(
      {
        day_id: dayId,
        section_id: phaseType,
        group_id: group.id,
        exercise_id: exercise.id,
        set_index: nextSetIndex,
        reps,
        load: load || undefined,
        rest: restSeconds.toString(),
      },
      {
        onSuccess: () => {
          onSetComplete(restSeconds, group.id);
        },
        onError: (error) => {
          toast.error(error.message || 'Errore nel salvataggio');
        },
      }
    );
  };

  const handleUndo = () => {
    undoLastSet(exercise.id, {
      onError: (error) => {
        toast.error(error.message || 'Errore');
      },
    });
  };

  const allSetsCompleted = completedSets >= exercise.sets;

  return (
    <div className={cn(
      "bg-background border border-muted rounded-2xl p-4 mb-4",
      allSetsCompleted && "opacity-60 border-green-500/30"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[16px] font-semibold leading-[22px]">
          {exercise.name || 'Esercizio'}
        </h4>
        <span className="text-[12px] font-medium bg-muted rounded-full px-3 py-1">
          Serie {completedSets}/{exercise.sets}
        </span>
      </div>

      <p className="text-[13px] text-muted-foreground">
        {exercise.sets} x {exercise.reps}
        {exercise.rest_seconds && ` • ${exercise.rest_seconds}s rec.`}
      </p>

      {/* Inputs */}
      <ExerciseInputRow
        exercise={exercise}
        reps={reps}
        setReps={setReps}
        load={load}
        setLoad={setLoad}
      />

      {/* CTA */}
      <Button
        onClick={handleCompleteSet}
        disabled={isCompleting || !reps || allSetsCompleted}
        className="w-full h-12 rounded-xl text-[16px] font-semibold mt-4"
      >
        {isCompleting ? (
          'Salvataggio...'
        ) : (
          <>
            <Check className="mr-2 h-5 w-5" />
            Completa serie {nextSetIndex}
          </>
        )}
      </Button>

      {/* Undo - Link style */}
      {completedSets > 0 && (
        <button
          onClick={handleUndo}
          disabled={isUndoing}
          className="text-[14px] font-medium text-muted-foreground flex items-center gap-1 mt-3 min-h-[44px]"
        >
          <Undo2 className="h-4 w-4" />
          {isUndoing ? 'Annullo...' : 'Annulla ultima serie'}
        </button>
      )}
    </div>
  );
}

// ================== Phase Section ==================

interface PhaseSectionProps {
  phase: SnapshotPhase;
  dayId: string;
  sessionId: string;
  actuals: ExerciseActual[];
  onSetComplete: (restSeconds: number, groupId: string) => void;
}

function PhaseSection({ phase, dayId, sessionId, actuals, onSetComplete }: PhaseSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {phase.type}
      </h3>
      {phase.groups.map((group) => {
        // Dispatch based on group type
        if (group.type === 'superset' || group.type === 'circuit') {
          return (
            <SupersetCard
              key={group.id}
              group={group}
              dayId={dayId}
              phaseType={phase.type}
              sessionId={sessionId}
              actuals={actuals}
              onSeriesComplete={onSetComplete}
            />
          );
        }

        // Single exercise (group.type === 'single' or default)
        return (
          <SingleExerciseCard
            key={group.id}
            exercise={group.exercises[0]}
            group={group}
            dayId={dayId}
            phaseType={phase.type}
            sessionId={sessionId}
            actuals={actuals}
            onSetComplete={onSetComplete}
          />
        );
      })}
    </div>
  );
}

// ================== Main Page ==================

export default function ClientLiveSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get('sessionId');

  const store = useClientSessionStore();
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);

  // Queries
  const { data: activeSession, isLoading: isActiveLoading } = useClientActiveSession();
  
  // Determine which session to use
  const sessionId = sessionIdFromUrl || activeSession?.id || store.activeSessionId;

  const { data: sessionDetail, isLoading: isDetailLoading } = useClientSessionDetail(sessionId || undefined);
  const { data: actuals = [], refetch: refetchActuals } = useClientSessionActuals(sessionId || undefined);

  // Mutations
  const { mutate: finishSession, isPending: isFinishing } = useFinishClientSession();
  const { mutate: discardSession, isPending: isDiscarding } = useDiscardClientSession();

  // Sync store with session on load
  useEffect(() => {
    if (sessionDetail && sessionDetail.started_at) {
      store.syncWithSession(sessionDetail.id, sessionDetail.started_at);
    }
  }, [sessionDetail?.id, sessionDetail?.started_at]);

  // Parse snapshot - sessionDetail comes from DB with plan_day_snapshot
  const snapshot = useMemo(() => {
    if (!sessionDetail) return null;
    const detail = sessionDetail as unknown as { plan_day_snapshot?: unknown };
    if (!detail.plan_day_snapshot) return null;
    return detail.plan_day_snapshot as PlanDaySnapshot;
  }, [sessionDetail]);

  const handleSetComplete = (restSeconds: number, groupId: string) => {
    if (restSeconds > 0) {
      store.startRestTimer(restSeconds, groupId);
    }
    refetchActuals();
  };

  const handleFinish = () => {
    if (!sessionId) return;
    finishSession(
      { sessionId },
      {
        onSuccess: () => {
          store.clear();
          toast.success('Allenamento completato! 💪');
          navigate('/client/app/workouts');
        },
        onError: (error) => {
          toast.error(error.message || 'Errore');
        },
      }
    );
  };

  const handleDiscard = () => {
    if (!sessionId) return;
    discardSession(sessionId, {
      onSuccess: () => {
        store.clear();
        toast.info('Allenamento abbandonato');
        navigate('/client/app/workouts');
      },
      onError: (error) => {
        toast.error(error.message || 'Errore');
      },
    });
  };

  const handlePauseToggle = () => {
    if (store.isPaused) {
      store.resume();
    } else {
      store.pause();
    }
  };

  // Loading state
  if (isActiveLoading || isDetailLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="p-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // No active session
  if (!sessionId || !snapshot) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center p-4">
        <Dumbbell className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Nessuna sessione attiva</h2>
        <p className="text-muted-foreground text-center mb-4">
          Torna alla pagina allenamenti per iniziare una nuova sessione.
        </p>
        <Button onClick={() => navigate('/client/app/workouts')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna agli allenamenti
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/client/app/workouts')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-lg font-semibold truncate">
              {snapshot.day.title}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePauseToggle}
          >
            {store.isPaused ? (
              <Play className="h-5 w-5" />
            ) : (
              <Pause className="h-5 w-5" />
            )}
          </Button>
        </div>
        <div className="flex flex-col items-center mt-3">
          <SessionHeaderTimer />
          {store.isPaused && (
            <Badge variant="secondary" className="mt-2">
              In pausa
            </Badge>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-32 space-y-6">
        {snapshot.phases.map((phase, index) => (
          <PhaseSection
            key={`${phase.type}-${index}`}
            phase={phase}
            dayId={snapshot.day.id}
            sessionId={sessionId}
            actuals={actuals}
            onSetComplete={handleSetComplete}
          />
        ))}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 space-y-2">
        <Button
          onClick={() => setShowFinishDialog(true)}
          className="w-full h-12 rounded-xl text-[16px] font-semibold"
        >
          <Check className="mr-2 h-5 w-5" />
          Termina allenamento
        </Button>
        <button
          onClick={() => setShowDiscardDialog(true)}
          className="w-full text-[14px] text-muted-foreground min-h-[44px]"
        >
          Abbandona sessione
        </button>
      </footer>

      {/* Finish Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminare l'allenamento?</AlertDialogTitle>
            <AlertDialogDescription>
              L'allenamento verrà salvato come completato. Hai registrato{' '}
              {actuals.length} serie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continua</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinish} disabled={isFinishing}>
              {isFinishing ? 'Salvataggio...' : 'Termina'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discard Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abbandonare la sessione?</AlertDialogTitle>
            <AlertDialogDescription>
              La sessione verrà marcata come abbandonata. Le serie già registrate
              verranno mantenute per riferimento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continua</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscard}
              disabled={isDiscarding}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDiscarding ? 'Abbandono...' : 'Abbandona'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
