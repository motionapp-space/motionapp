/**
 * Client Live Session Page
 * 
 * Mobile-first UI for autonomous client workout tracking.
 * Renders exercises from session.plan_day_snapshot.
 * 
 * Features:
 * - Sticky top bar (h-14) with back, title, timer, pause
 * - Sticky bottom bar with "Termina allenamento" CTA
 * - Superset/circuit as single unit (1 CTA, 1 counter)
 * - Touch-first inputs with placeholders only
 * - Zero toast during live session
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Check, Undo2, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// ================== Top Bar Timer ==================

function TopBarTimer() {
  const store = useClientSessionStore();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const isRestActive = store.isRestActive();
  const remainingRest = store.getRemainingRestSeconds();
  const elapsed = store.getElapsedSeconds();
  const isOvertime = remainingRest < 0;

  // When rest is active, show ONLY the countdown
  if (isRestActive) {
    return (
      <span className={cn(
        "text-[15px] font-semibold tabular-nums font-mono",
        isOvertime ? "text-destructive" : "text-foreground"
      )}>
        {formatRestTime(remainingRest)}
      </span>
    );
  }

  // Default: session duration
  return (
    <span className="text-[13px] font-medium text-muted-foreground tabular-nums font-mono">
      {formatElapsedTime(elapsed)}
    </span>
  );
}

// ================== Completed Series Chips ==================

interface CompletedSeriesChipsProps {
  actuals: ExerciseActual[];
  exerciseIds: string[];
  numExercises: number;
}

function CompletedSeriesChips({ actuals, exerciseIds, numExercises }: CompletedSeriesChipsProps) {
  const groupActuals = actuals.filter(a => exerciseIds.includes(a.exercise_id));
  const completedSeries = Math.floor(groupActuals.length / numExercises);
  
  if (completedSeries === 0) return null;

  // Group actuals by set_index
  const seriesData: Array<{ index: number; summary: string }> = [];
  
  for (let i = 1; i <= completedSeries; i++) {
    const seriesActuals = groupActuals.filter(a => a.set_index === i);
    
    if (seriesActuals.length > 0) {
      const first = seriesActuals[0];
      const loadDisplay = first.load ? `${first.load}` : '';
      seriesData.push({
        index: i,
        summary: loadDisplay ? `${first.reps}×${loadDisplay}` : `${first.reps}`
      });
    } else {
      seriesData.push({ index: i, summary: '' });
    }
  }

  // Show max 3 chips
  const visibleChips = seriesData.slice(0, 3);
  const hiddenCount = seriesData.length - 3;

  return (
    <div className="flex flex-wrap gap-2">
      {visibleChips.map(({ index, summary }) => (
        <span
          key={index}
          className="h-7 px-3 rounded-full bg-muted text-[13px] font-medium flex items-center gap-1"
        >
          #{index}
          {summary && <span className="text-muted-foreground">{summary}</span>}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className="h-7 px-3 rounded-full bg-muted text-[13px] flex items-center text-muted-foreground">
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}

// ================== Exercise Inputs (Placeholder Only) ==================

interface ExerciseInputsProps {
  exercise: SnapshotExercise;
  reps: string;
  setReps: (value: string) => void;
  load: string;
  setLoad: (value: string) => void;
}

function ExerciseInputs({ exercise, reps, setReps, load, setLoad }: ExerciseInputsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Input
        type="text"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        className="h-11 rounded-xl text-[16px] font-medium text-center"
        placeholder={`Reps (${exercise.reps || '10'})`}
      />
      <Input
        type="text"
        inputMode="decimal"
        value={load}
        onChange={(e) => setLoad(e.target.value)}
        className="h-11 rounded-xl text-[16px] font-medium text-center"
        placeholder="Carico (kg)"
      />
    </div>
  );
}

// ================== Series Badge ==================

function SeriesBadge({ completed, target }: { completed: number; target: number }) {
  const getBadgeClasses = () => {
    if (completed > target) return "bg-emerald-500/20 text-emerald-700 font-medium";
    if (completed === target) return "bg-emerald-500/15 text-emerald-700 font-medium";
    return "bg-muted text-foreground";
  };

  return (
    <span className={cn("h-7 px-3 rounded-full text-[13px] leading-none flex items-center", getBadgeClasses())}>
      Serie {completed}/{target}
    </span>
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
  const [inputValues, setInputValues] = useState<Record<string, { reps: string; load: string }>>(() => {
    const initial: Record<string, { reps: string; load: string }> = {};
    group.exercises.forEach(ex => {
      initial[ex.id] = { reps: ex.reps || '', load: '' };
    });
    return initial;
  });

  const { mutate: completeSeries, isPending: isCompleting } = useCompleteSupersetSeries(sessionId);
  const { mutate: undoSeries, isPending: isUndoing } = useUndoSupersetLastSeries(sessionId);

  const numExercises = group.exercises.length;
  const groupExerciseIds = group.exercises.map(e => e.id);
  const groupActuals = actuals.filter(a => groupExerciseIds.includes(a.exercise_id));
  const completedSeries = Math.floor(groupActuals.length / numExercises);
  const targetSeries = Math.min(...group.exercises.map(e => e.sets));
  const nextSeriesIndex = completedSeries + 1;
  const restSeconds = group.exercises[0]?.rest_seconds || 60;

  const handleCompleteSeries = () => {
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
      onSuccess: () => onSeriesComplete(restSeconds, group.id),
      onError: (error) => toast.error(error.message || 'Errore nel salvataggio'),
    });
  };

  const handleUndoSeries = () => {
    undoSeries(groupExerciseIds, {
      onError: (error) => toast.error(error.message || 'Errore'),
    });
  };

  const allRepsFilled = group.exercises.every(ex => 
    inputValues[ex.id]?.reps && inputValues[ex.id].reps.trim() !== ''
  );

  return (
    <div className="bg-background border border-muted rounded-2xl p-4">
      {/* Header - Single line */}
      <div className="flex items-center justify-between mb-4">
        <span className="h-7 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[12px] font-medium">
          {group.type === 'circuit' ? 'Circuit' : 'Superset'}
          {group.label && ` ${group.label}`}
        </span>
        <SeriesBadge completed={completedSeries} target={targetSeries} />
      </div>

      {/* Exercises - Clean, no redundant labels */}
      <div className="space-y-4">
        {group.exercises.map((exercise, idx) => (
          <div key={exercise.id} className={cn(idx > 0 && "pt-4 border-t border-muted")}>
            <h4 className="text-[16px] font-semibold mb-2">
              {exercise.name || 'Esercizio'}
            </h4>
            <ExerciseInputs
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
      </div>

      {/* CTA - Always visible */}
      <Button
        onClick={handleCompleteSeries}
        disabled={isCompleting || !allRepsFilled}
        className="w-full h-12 rounded-xl text-[16px] font-semibold mt-4"
      >
        {isCompleting ? 'Salvataggio...' : `✓ Completa serie ${nextSeriesIndex}`}
      </Button>

      {/* Completed series + Undo - Below CTA */}
      {completedSeries > 0 && (
        <div className="mt-4 space-y-3">
          <CompletedSeriesChips
            actuals={actuals}
            exerciseIds={groupExerciseIds}
            numExercises={numExercises}
          />
          <button
            onClick={handleUndoSeries}
            disabled={isUndoing}
            className="text-[13px] text-muted-foreground flex items-center gap-1 min-h-[44px]"
          >
            <Undo2 className="h-4 w-4" />
            {isUndoing ? 'Annullo...' : 'Annulla ultima serie'}
          </button>
        </div>
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

  const exerciseActuals = actuals.filter(a => a.exercise_id === exercise.id);
  const completedSets = exerciseActuals.length;
  const targetSets = exercise.sets;
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
        onSuccess: () => onSetComplete(restSeconds, group.id),
        onError: (error) => toast.error(error.message || 'Errore nel salvataggio'),
      }
    );
  };

  const handleUndo = () => {
    undoLastSet(exercise.id, {
      onError: (error) => toast.error(error.message || 'Errore'),
    });
  };

  return (
    <div className="bg-background border border-muted rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[16px] font-semibold">
          {exercise.name || 'Esercizio'}
        </h4>
        <SeriesBadge completed={completedSets} target={targetSets} />
      </div>

      {/* Inputs */}
      <ExerciseInputs
        exercise={exercise}
        reps={reps}
        setReps={setReps}
        load={load}
        setLoad={setLoad}
      />

      {/* CTA */}
      <Button
        onClick={handleCompleteSet}
        disabled={isCompleting || !reps}
        className="w-full h-12 rounded-xl text-[16px] font-semibold mt-4"
      >
        {isCompleting ? 'Salvataggio...' : `✓ Completa serie ${nextSetIndex}`}
      </Button>

      {/* Completed series + Undo - Below CTA */}
      {completedSets > 0 && (
        <div className="mt-4 space-y-3">
          <CompletedSeriesChips
            actuals={actuals}
            exerciseIds={[exercise.id]}
            numExercises={1}
          />
          <button
            onClick={handleUndo}
            disabled={isUndoing}
            className="text-[13px] text-muted-foreground flex items-center gap-1 min-h-[44px]"
          >
            <Undo2 className="h-4 w-4" />
            {isUndoing ? 'Annullo...' : 'Annulla ultima serie'}
          </button>
        </div>
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
    <div className="space-y-3">
      <h3 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide px-1">
        {phase.type}
      </h3>
      {phase.groups.map((group) => {
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

  // Parse snapshot
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
        onError: (error) => toast.error(error.message || 'Errore'),
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
      onError: (error) => toast.error(error.message || 'Errore'),
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
          <Skeleton className="h-14 w-full" />
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
    <div className="flex flex-col min-h-screen bg-muted/30">
      {/* Top Bar - Sticky h-14 */}
      <header className="sticky top-0 z-50 h-14 bg-background/95 backdrop-blur border-b flex items-center px-4">
        {/* Left: Back */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => navigate('/client/app/workouts')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Center: Title + Timer */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0">
          <span className="text-[16px] font-semibold leading-tight truncate max-w-[200px]">
            {snapshot.day.title}
          </span>
          <TopBarTimer />
        </div>

        {/* Right: Pause */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handlePauseToggle}
        >
          {store.isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
        </Button>
      </header>

      {/* Pause Badge */}
      {store.isPaused && (
        <div className="bg-background border-b px-4 py-2">
          <Badge variant="secondary" className="mx-auto block w-fit">
            In pausa
          </Badge>
        </div>
      )}

      {/* Content - Scrollable */}
      <main className="flex-1 p-4 pb-28 space-y-6">
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

      {/* Bottom Bar - Sticky */}
      <footer className="sticky bottom-0 z-50 bg-background border-t p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDiscardDialog(true)}
            className="text-[14px] text-muted-foreground min-h-[48px] px-4"
          >
            Abbandona
          </button>
          <Button
            onClick={() => setShowFinishDialog(true)}
            className="flex-1 h-12 rounded-xl text-[16px] font-semibold"
          >
            <Check className="mr-2 h-5 w-5" />
            Termina allenamento
          </Button>
        </div>
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
