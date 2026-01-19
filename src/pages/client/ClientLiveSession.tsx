/**
 * Client Live Session Page (Step-Based, Mobile-First)
 * 
 * - One group visible at a time
 * - Manual navigation between groups (Prev/Next)
 * - Sticky 88px top bar with context
 * - Sticky bottom bar with "Termina allenamento"
 * - No infinite scroll, maximum immersion
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Check, Undo2, Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react';
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
import type { PlanDaySnapshot, SnapshotExercise, SnapshotGroup } from '@/features/session-tracking/core/types';
import type { ExerciseActual } from '@/features/sessions/types';

// ================== Types ==================

interface FlatGroup {
  phaseType: string;
  phaseIndex: number;
  globalIndex: number;
  group: SnapshotGroup;
}

// ================== Format Rest Time ==================

function formatRestTime(seconds: number): string {
  const absSeconds = Math.abs(seconds);
  const mins = Math.floor(absSeconds / 60);
  const secs = absSeconds % 60;
  const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return seconds < 0 ? `−${formatted}` : formatted;
}

// ================== Top Bar Timer ==================

interface TopBarTimerProps {
  showSessionDuration?: boolean;
}

function TopBarTimer({ showSessionDuration = true }: TopBarTimerProps) {
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

  // When rest is active, show ONLY the countdown (20px primary/destructive)
  if (isRestActive) {
    return (
      <div className="text-center">
        <span className={cn(
          "text-[22px] font-semibold tabular-nums font-mono",
          isOvertime ? "text-destructive" : "text-primary"
        )}>
          {formatRestTime(remainingRest)}
        </span>
      </div>
    );
  }

  // Default: session duration (14px muted)
  if (!showSessionDuration) return null;
  
  return (
    <span className="text-[14px] text-muted-foreground tabular-nums font-mono">
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

  return (
    <div className="mt-4">
      <p className="text-[13px] font-medium text-muted-foreground mb-2">
        Serie completate
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {seriesData.map(({ index, summary }) => (
          <span
            key={index}
            className="h-8 px-3 rounded-full bg-muted text-[13px] font-medium flex items-center gap-1 shrink-0"
          >
            #{index}
            {summary && <span className="text-muted-foreground">{summary}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

// ================== Exercise Block ==================

interface ExerciseBlockProps {
  exercise: SnapshotExercise;
  reps: string;
  setReps: (value: string) => void;
  load: string;
  setLoad: (value: string) => void;
  showDivider?: boolean;
}

function ExerciseBlock({ exercise, reps, setReps, load, setLoad, showDivider }: ExerciseBlockProps) {
  const restDisplay = exercise.rest_seconds 
    ? `Recupero ${exercise.rest_seconds}s` 
    : '';
  const targetDisplay = `${exercise.sets} × ${exercise.reps || '10'}${restDisplay ? ` · ${restDisplay}` : ''}`;

  return (
    <div className={cn(showDivider && "pt-4 border-t border-muted/60")}>
      {/* Exercise Name */}
      <h4 className="text-[17px] font-semibold">
        {exercise.name || 'Esercizio'}
      </h4>
      
      {/* Target */}
      <p className="text-[13px] text-muted-foreground mt-1">
        {targetDisplay}
      </p>
      
      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label className="text-[12px] text-muted-foreground mb-1 block">Reps</label>
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
          <label className="text-[12px] text-muted-foreground mb-1 block">Carico</label>
          <Input
            type="text"
            inputMode="decimal"
            value={load}
            onChange={(e) => setLoad(e.target.value)}
            className="h-11 rounded-xl text-[16px] font-medium text-center"
            placeholder="kg"
          />
        </div>
      </div>
    </div>
  );
}

// ================== Series Badge ==================

function SeriesBadge({ completed, target }: { completed: number; target: number }) {
  const getBadgeClasses = () => {
    if (completed >= target) return "bg-emerald-500/15 text-emerald-700";
    return "bg-muted text-foreground";
  };

  return (
    <span className={cn("text-[13px] font-medium rounded-full px-3 py-1", getBadgeClasses())}>
      Serie {completed}/{target}
    </span>
  );
}

// ================== Group Card ==================

interface GroupCardProps {
  flatGroup: FlatGroup;
  dayId: string;
  sessionId: string;
  actuals: ExerciseActual[];
  onSeriesComplete: (restSeconds: number, groupId: string) => void;
}

function GroupCard({
  flatGroup,
  dayId,
  sessionId,
  actuals,
  onSeriesComplete,
}: GroupCardProps) {
  const { group, phaseType } = flatGroup;
  const isMultiExercise = group.type === 'superset' || group.type === 'circuit';
  
  const [inputValues, setInputValues] = useState<Record<string, { reps: string; load: string }>>(() => {
    const initial: Record<string, { reps: string; load: string }> = {};
    group.exercises.forEach(ex => {
      initial[ex.id] = { reps: ex.reps || '', load: '' };
    });
    return initial;
  });

  // Reset input values when group changes
  useEffect(() => {
    const initial: Record<string, { reps: string; load: string }> = {};
    group.exercises.forEach(ex => {
      initial[ex.id] = { reps: ex.reps || '', load: '' };
    });
    setInputValues(initial);
  }, [group.id]);

  const { mutate: completeSeries, isPending: isCompletingMulti } = useCompleteSupersetSeries(sessionId);
  const { mutate: undoSeries, isPending: isUndoingMulti } = useUndoSupersetLastSeries(sessionId);
  const { mutate: completeSet, isPending: isCompletingSingle } = useCompleteClientSet(sessionId);
  const { mutate: undoLastSet, isPending: isUndoingSingle } = useUndoClientLastSet(sessionId);

  const isCompleting = isCompletingMulti || isCompletingSingle;
  const isUndoing = isUndoingMulti || isUndoingSingle;

  const numExercises = group.exercises.length;
  const groupExerciseIds = group.exercises.map(e => e.id);
  const groupActuals = actuals.filter(a => groupExerciseIds.includes(a.exercise_id));
  const completedSeries = Math.floor(groupActuals.length / numExercises);
  const targetSeries = Math.min(...group.exercises.map(e => e.sets));
  const nextSeriesIndex = completedSeries + 1;
  const restSeconds = group.exercises[0]?.rest_seconds || 60;

  const handleComplete = () => {
    if (isMultiExercise) {
      // Batch complete for superset/circuit
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
        onError: (error) => toast.error(error.message || 'Errore nel completamento'),
      });
    } else {
      // Single exercise
      const exercise = group.exercises[0];
      completeSet(
        {
          day_id: dayId,
          section_id: phaseType,
          group_id: group.id,
          exercise_id: exercise.id,
          set_index: nextSeriesIndex,
          reps: inputValues[exercise.id]?.reps || exercise.reps || '',
          load: inputValues[exercise.id]?.load || undefined,
          rest: restSeconds.toString(),
        },
        {
          onSuccess: () => onSeriesComplete(restSeconds, group.id),
          onError: (error) => toast.error(error.message || 'Errore nel salvataggio'),
        }
      );
    }
  };

  const handleUndo = () => {
    if (isMultiExercise) {
      undoSeries(groupExerciseIds, {
        onError: (error) => toast.error(error.message || 'Errore'),
      });
    } else {
      undoLastSet(group.exercises[0].id, {
        onError: (error) => toast.error(error.message || 'Errore'),
      });
    }
  };

  const allRepsFilled = group.exercises.every(ex => 
    inputValues[ex.id]?.reps && inputValues[ex.id].reps.trim() !== ''
  );

  return (
    <div className="px-4 mt-4 space-y-6">
      {/* Exercises */}
      {group.exercises.map((exercise, idx) => (
        <ExerciseBlock
          key={exercise.id}
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
          showDivider={idx > 0}
        />
      ))}

      {/* Completed Series Chips */}
      <CompletedSeriesChips
        actuals={actuals}
        exerciseIds={groupExerciseIds}
        numExercises={numExercises}
      />

      {/* CTA */}
      <Button
        onClick={handleComplete}
        disabled={isCompleting || !allRepsFilled}
        className="w-full h-14 rounded-2xl text-[16px] font-semibold"
      >
        {isCompleting ? 'Salvataggio...' : `✓ Completa serie ${nextSeriesIndex}`}
      </Button>

      {/* Undo - Secondary action */}
      {completedSeries > 0 && (
        <button
          onClick={handleUndo}
          disabled={isUndoing}
          className="text-[14px] text-muted-foreground min-h-[44px] flex items-center gap-1 hover:underline underline-offset-2"
        >
          <Undo2 className="h-4 w-4" />
          {isUndoing ? 'Annullo...' : 'Annulla ultima serie'}
        </button>
      )}
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

  // Flatten all groups across all phases
  const flatGroups = useMemo((): FlatGroup[] => {
    if (!snapshot?.phases) return [];
    
    const result: FlatGroup[] = [];
    snapshot.phases.forEach((phase, phaseIdx) => {
      phase.groups.forEach((group) => {
        result.push({
          phaseType: phase.type,
          phaseIndex: phaseIdx,
          globalIndex: result.length,
          group,
        });
      });
    });
    return result;
  }, [snapshot]);

  // Sync total groups with store
  useEffect(() => {
    if (flatGroups.length > 0 && store.totalGroups !== flatGroups.length) {
      store.setTotalGroups(flatGroups.length);
    }
  }, [flatGroups.length]);

  // Current group
  const currentFlatGroup = flatGroups[store.currentGroupIndex] || null;

  // Compute completed series for current group (for badge)
  const currentGroupSeriesInfo = useMemo(() => {
    if (!currentFlatGroup) return { completed: 0, target: 0 };
    
    const group = currentFlatGroup.group;
    const numExercises = group.exercises.length;
    const groupExerciseIds = group.exercises.map(e => e.id);
    const groupActuals = actuals.filter(a => groupExerciseIds.includes(a.exercise_id));
    const completedSeries = Math.floor(groupActuals.length / numExercises);
    const targetSeries = Math.min(...group.exercises.map(e => e.sets));
    
    return { completed: completedSeries, target: targetSeries };
  }, [currentFlatGroup, actuals]);

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
          navigate('/client/app/workouts');
        },
        onError: (error) => toast.error(error.message || 'Errore nel salvataggio'),
      }
    );
  };

  const handleDiscard = () => {
    if (!sessionId) return;
    discardSession(sessionId, {
      onSuccess: () => {
        store.clear();
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

  // Navigation handlers
  const canGoPrev = store.currentGroupIndex > 0;
  const canGoNext = store.currentGroupIndex < store.totalGroups - 1;

  // Loading state
  if (isActiveLoading || isDetailLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="p-4 space-y-4">
          <Skeleton className="h-[88px] w-full" />
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

  // Group type label
  const getGroupTypeLabel = () => {
    if (!currentFlatGroup) return null;
    const { group } = currentFlatGroup;
    if (group.type === 'superset') return `Superset${group.label ? ` ${group.label}` : ''}`;
    if (group.type === 'circuit') return `Circuit${group.label ? ` ${group.label}` : ''}`;
    return null;
  };

  const groupTypeLabel = getGroupTypeLabel();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Bar - Sticky 96px, 3 rows */}
      <header className="sticky top-0 z-50 bg-background border-b border-muted">
        <div className="h-[96px] px-4 pt-3 pb-2 flex flex-col justify-between">
          {/* Row 1: Navigation - h-8 */}
          <div className="h-8 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => navigate('/client/app/workouts')}
            >
              <ArrowLeft className="size-6 text-foreground" />
            </Button>

            <span className="text-[18px] font-semibold leading-[24px] text-foreground truncate max-w-[200px] text-center">
              {snapshot.day.title}
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={handlePauseToggle}
            >
              {store.isPaused ? (
                <Play className="size-6 text-muted-foreground" />
              ) : (
                <Pause className="size-6 text-muted-foreground" />
              )}
            </Button>
          </div>

          {/* Row 2: Context - h-5 */}
          <div className="h-5 flex items-center justify-center">
            <span className="text-[13px] leading-[20px] text-muted-foreground font-normal">
              {currentFlatGroup?.phaseType || 'Warm-up'} · {store.currentGroupIndex + 1} / {store.totalGroups}
            </span>
          </div>

          {/* Row 3: Timer - h-8 */}
          <div className="h-8 flex items-center justify-center">
            <TopBarTimer />
          </div>
        </div>
      </header>

      {/* Pause Badge - outside header */}
      {store.isPaused && (
        <div className="bg-background border-b px-4 py-2">
          <Badge variant="secondary" className="mx-auto block w-fit">
            In pausa
          </Badge>
        </div>
      )}

      {/* Content - starts after 96px header */}
      <main className="flex-1 pb-[calc(80px+env(safe-area-inset-bottom))]">
        {/* Group Header */}
        {currentFlatGroup && (
          <div className="mt-4 px-4 flex items-center justify-between">
            {/* Left: Group type pill (only for superset/circuit) */}
            {groupTypeLabel ? (
              <span className="text-[13px] font-medium bg-primary/10 text-primary rounded-full px-3 py-1">
                {groupTypeLabel}
              </span>
            ) : (
              <span />
            )}
            
            {/* Right: Series badge */}
            <SeriesBadge 
              completed={currentGroupSeriesInfo.completed} 
              target={currentGroupSeriesInfo.target} 
            />
          </div>
        )}

        {/* Group Content (no card) */}
        {currentFlatGroup && (
          <GroupCard
            flatGroup={currentFlatGroup}
            dayId={snapshot.day.id}
            sessionId={sessionId}
            actuals={actuals}
            onSeriesComplete={handleSetComplete}
          />
        )}

        {/* Group Navigation */}
        <div className="mt-6 px-4 flex justify-between items-center">
          <button
            onClick={() => store.prevGroup()}
            disabled={!canGoPrev}
            className={cn(
              "text-[14px] font-medium min-h-[44px] px-2 flex items-center gap-1",
              canGoPrev ? "text-muted-foreground" : "text-muted-foreground/40"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Precedente
          </button>

          <button
            onClick={() => store.nextGroup()}
            disabled={!canGoNext}
            className={cn(
              "text-[14px] font-medium min-h-[44px] px-2 flex items-center gap-1",
              canGoNext ? "text-muted-foreground" : "text-muted-foreground/40"
            )}
          >
            Successivo
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </main>

      {/* Footer - Sticky Bottom */}
      <footer 
        className="sticky bottom-0 z-40 bg-background border-t p-4"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
      >
        <Button
          onClick={() => setShowFinishDialog(true)}
          className="w-full h-14 rounded-2xl text-[16px] font-semibold"
        >
          <Check className="mr-2 h-5 w-5" />
          Termina allenamento
        </Button>
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
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="sm:flex-1">Continua</AlertDialogCancel>
            <button
              onClick={() => {
                setShowFinishDialog(false);
                setShowDiscardDialog(true);
              }}
              className="text-[14px] text-destructive hover:underline underline-offset-2 min-h-[44px]"
            >
              Abbandona sessione
            </button>
            <AlertDialogAction 
              onClick={handleFinish} 
              disabled={isFinishing}
              className="sm:flex-1"
            >
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
