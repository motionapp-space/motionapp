/**
 * Client Live Session Page (Step-Based, Mobile-First)
 * 
 * MVP "Best-in-class" implementation:
 * - Stable 3-row header (Row 3 always reserved h-8 for rest timer)
 * - FALLBACK_HEADER = 140 for iOS safe-area + 3 rows
 * - Single scroll container with stable layout
 * - CTA block above series history chips
 * - Dynamic footer styling based on completion
 */

import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Undo2, Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
  formatRestTime,
  getExerciseAbbrev,
  formatExerciseActual,
  formatLoadDisplay,
} from '@/features/session-tracking/utils/formatters';
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

// ================== Phase Type Translation ==================

function translatePhaseType(phaseType: string): string {
  const translations: Record<string, string> = {
    'warm-up': 'Riscaldamento',
    'warmup': 'Riscaldamento',
    'Warm-up': 'Riscaldamento',
    'Warmup': 'Riscaldamento',
    'main': 'Corpo principale',
    'Main': 'Corpo principale',
    'cooldown': 'Defaticamento',
    'cool-down': 'Defaticamento',
    'Cooldown': 'Defaticamento',
    'stretching': 'Stretching',
    'Stretching': 'Stretching',
  };
  return translations[phaseType] || phaseType;
}

// ================== Completed Series Chips (MVP: Complete Sets Only) ==================

interface CompletedSeriesChipsProps {
  actuals: ExerciseActual[];
  exerciseIds: string[];
  numExercises: number;
  exercises: SnapshotExercise[];
}

function CompletedSeriesChips({ actuals, exerciseIds, numExercises, exercises }: CompletedSeriesChipsProps) {
  const groupActuals = actuals.filter(a => exerciseIds.includes(a.exercise_id));
  
  // Group by set_index
  const setIndexMap = new Map<number, ExerciseActual[]>();
  groupActuals.forEach(a => {
    const existing = setIndexMap.get(a.set_index) || [];
    setIndexMap.set(a.set_index, [...existing, a]);
  });
  
  // Only include COMPLETE sets (all exercises present)
  const completeSets: number[] = [];
  setIndexMap.forEach((setActuals, setIndex) => {
    const uniqueExercises = new Set(setActuals.map(a => a.exercise_id));
    if (uniqueExercises.size === numExercises) {
      completeSets.push(setIndex);
    }
  });
  completeSets.sort((a, b) => a - b);
  
  if (completeSets.length === 0) return null;

  const seriesData = completeSets.map(setIndex => {
    const setActuals = setIndexMap.get(setIndex) || [];
    
    // Dedupe: last entry per exercise wins (handles retries/duplicates)
    const actualByExercise = new Map<string, ExerciseActual>();
    setActuals.forEach(a => actualByExercise.set(a.exercise_id, a));
    
    if (numExercises > 1) {
      // Superset/circuit: show all exercises
      const parts = exercises.map(ex => {
        const actual = actualByExercise.get(ex.id);
        const abbrev = getExerciseAbbrev(ex.name);
        return formatExerciseActual(abbrev, actual!.reps, actual!.load);
      });
      return { index: setIndex, summary: parts.join(' · ') };
    } else {
      // Single exercise
      const actual = actualByExercise.get(exercises[0].id);
      return { 
        index: setIndex, 
        summary: formatLoadDisplay(actual!.reps, actual!.load)
      };
    }
  });

  return (
    <div className="mt-3">
      <p className="text-sm font-medium text-muted-foreground">Serie completate</p>
      <div className="flex flex-wrap gap-2 mt-1.5">
        {seriesData.map(({ index, summary }) => (
          <span
            key={index}
            className="h-7 px-3 rounded-full bg-muted text-xs font-medium tabular-nums flex items-center gap-1.5 shrink-0"
          >
            <span className="text-foreground">#{index}</span>
            <span className="text-muted-foreground">{summary}</span>
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
  
  // Graceful degradation: show reps only if present (no default to 10)
  const repsDisplay = exercise.reps ? ` × ${exercise.reps} rip` : '';
  const targetDisplay = `Obiettivo · ${exercise.sets} serie${repsDisplay}${restDisplay ? ` · ${restDisplay}` : ''}`;

  return (
    <div className={cn(showDivider && "pt-4 border-t border-border/40")}>
      {/* Exercise Name */}
      <h4 className="text-lg font-semibold leading-snug">
        {exercise.name || 'Esercizio'}
      </h4>
      
      {/* Target */}
      <p className="text-sm text-muted-foreground leading-tight mt-0.5">
        {targetDisplay}
      </p>
      
      {/* Inputs */}
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        <div>
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1 block">Reps</label>
          <Input
            type="text"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="h-9 rounded-xl text-sm font-medium text-center bg-muted/30 border-border focus:border-primary focus:ring-1 focus:ring-primary/30"
            placeholder={exercise.reps || '—'}
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1 block">Carico</label>
          <Input
            type="text"
            inputMode="decimal"
            value={load}
            onChange={(e) => setLoad(e.target.value)}
            className="h-9 rounded-xl text-sm font-medium text-center bg-muted/30 border-border focus:border-primary focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/60"
            placeholder="kg"
          />
        </div>
      </div>
    </div>
  );
}

// ================== Series Badge (Clamp + Conditional Styling) ==================

function SeriesBadge({ completed, target }: { completed: number; target: number }) {
  // Clamp to prevent Serie 6/3 display
  const clampedCompleted = Math.min(completed, target);
  
  // Dev warning for data integrity
  if (import.meta.env.DEV && completed > target) {
    console.warn(`[SeriesBadge] Data integrity: completed (${completed}) > target (${target})`);
  }
  
  // Only apply success styling when EXACTLY complete
  const isComplete = clampedCompleted === target && target > 0;

  return (
    <span className={cn(
      "h-8 text-sm font-medium rounded-full px-3 flex items-center",
      isComplete 
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" 
        : "bg-muted text-foreground"
    )}>
      Serie {clampedCompleted}/{target}
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
  
  // Calculate completed series using set_index completeness
  const setIndexMap = new Map<number, Set<string>>();
  groupActuals.forEach(a => {
    const existing = setIndexMap.get(a.set_index) || new Set();
    existing.add(a.exercise_id);
    setIndexMap.set(a.set_index, existing);
  });
  
  let completedSeries = 0;
  setIndexMap.forEach((exerciseSet) => {
    if (exerciseSet.size === numExercises) {
      completedSeries++;
    }
  });
  
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
    <>
      {/* Card container - Notion-like, soft border */}
      <div className="p-3.5 rounded-2xl bg-background border border-border/60 space-y-3">
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

        {/* CTA Block - FIRST, before history */}
        <div className="mt-3 space-y-2">
          <Button
            onClick={handleComplete}
            disabled={isCompleting || !allRepsFilled}
            className="w-full h-11 rounded-2xl text-sm font-semibold gap-2"
          >
            <Check className="size-[18px]" strokeWidth={2} />
            {isCompleting ? 'Salvataggio...' : 'Completa serie'}
          </Button>

          {/* Undo - lighter emphasis */}
          {completedSeries > 0 && (
            <button
              onClick={handleUndo}
              disabled={isUndoing}
              className="text-sm text-muted-foreground font-medium min-h-[44px] flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Undo2 className="size-4" />
              {isUndoing ? 'Annullo...' : 'Annulla ultima serie'}
            </button>
          )}
        </div>

        {/* Series history - AFTER CTA */}
        <CompletedSeriesChips
          actuals={actuals}
          exerciseIds={groupExerciseIds}
          numExercises={numExercises}
          exercises={group.exercises}
        />
      </div>
    </>
  );
}

// ================== Main Page ==================

export default function ClientLiveSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get('sessionId');

  const store = useClientSessionStore();
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Dynamic header height measurement
  const headerRef = useRef<HTMLElement | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // FALLBACK_HEADER = 140 for iOS safe-area + 3 rows + font scaling
  const FALLBACK_HEADER = 140;
  const effectiveHeaderHeight = headerHeight > 0 ? headerHeight : FALLBACK_HEADER;

  useLayoutEffect(() => {
    let rafId: number | null = null;
    let rafId2: number | null = null;
    let ro: ResizeObserver | null = null;

    const measure = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.getBoundingClientRect().height);
      }
    };

    // Immediate measure
    measure();

    // RAF fallback: retry next frame if ref wasn't ready
    rafId = requestAnimationFrame(() => {
      measure();
      // Double-check after another frame (for re-mount scenarios)
      rafId2 = requestAnimationFrame(measure);
    });

    // ResizeObserver - attach when element is available
    ro = new ResizeObserver(measure);
    if (headerRef.current) {
      ro.observe(headerRef.current);
    }

    // Also listen for window resize
    window.addEventListener("resize", measure);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (rafId2) cancelAnimationFrame(rafId2);
      if (ro) ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Re-measure when header ref becomes available (re-mount fix)
  useEffect(() => {
    if (headerRef.current && headerHeight === 0) {
      setHeaderHeight(headerRef.current.getBoundingClientRect().height);
    }
  });

  // Reset scroll state on mount
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0 });
    }
    setIsScrolled(false);
  }, []);

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
    
    // Calculate completed series using set_index completeness
    const setIndexMap = new Map<number, Set<string>>();
    groupActuals.forEach(a => {
      const existing = setIndexMap.get(a.set_index) || new Set();
      existing.add(a.exercise_id);
      setIndexMap.set(a.set_index, existing);
    });
    
    let completedSeries = 0;
    setIndexMap.forEach((exerciseSet) => {
      if (exerciseSet.size === numExercises) {
        completedSeries++;
      }
    });
    
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

  // Centralized timer tick (single interval, visibility-aware)
  const [, setTimerTick] = useState(0);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = () => setTimerTick(n => n + 1);

    const startInterval = () => {
      if (!intervalId) {
        intervalId = setInterval(tick, 1000);
      }
    };

    const stopInterval = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopInterval();
      } else {
        tick(); // Immediate update when visible
        startInterval();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    startInterval();

    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Compute timer values (re-computed each tick)
  const elapsed = store.getElapsedSeconds();
  const remainingRest = store.getRemainingRestSeconds();
  const isRestActive = store.isRestActive();
  
  // Rest display: showRest based on isRestActive (not remaining > 0) to avoid flicker
  const showRest = isRestActive;
  const clampedRest = Math.max(0, remainingRest);

  // Navigation handlers
  const canGoPrev = store.currentGroupIndex > 0;
  const canGoNext = store.currentGroupIndex < store.totalGroups - 1;
  const isLastGroup = store.currentGroupIndex === store.totalGroups - 1;
  
  // Dynamic footer: filled only when last group is complete
  const isLastGroupComplete = isLastGroup && 
    currentGroupSeriesInfo.completed >= currentGroupSeriesInfo.target &&
    currentGroupSeriesInfo.target > 0;

  // Loading state
  if (isActiveLoading || isDetailLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-0 items-center justify-center p-4">
        <div className="space-y-4 w-full max-w-[520px]">
          <Skeleton className="h-[140px] w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // No active session
  if (!sessionId || !snapshot) {
    return (
      <div className="flex-1 flex flex-col min-h-0 items-center justify-center p-4">
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
    <div className="flex-1 flex flex-col min-h-0">
      {/* Top Bar - Stable 3-row layout with reserved Row 3 */}
      <header
        ref={headerRef}
        className={cn(
          "fixed top-0 left-0 right-0 w-full z-50 bg-background pt-[env(safe-area-inset-top)] transition-shadow duration-150",
          isScrolled 
            ? "border-b border-border/80 shadow-sm" 
            : "border-b border-border/60"
        )}
      >
        <div className="px-4 pt-2 pb-2 flex flex-col">
          {/* Row 1: Exit (left) — Title (center) — placeholder (right) */}
          <div className="flex items-center justify-between h-11">
            <button
              onClick={() => navigate("/client/app/workouts")}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] -ml-1 px-1"
            >
              <ChevronLeft className="size-5" />
              <span className="text-sm font-medium">Esci</span>
            </button>

            <span className="text-base font-semibold leading-6 text-center line-clamp-1 max-w-[200px] absolute left-1/2 -translate-x-1/2">
              {snapshot?.day?.title || 'Allenamento'}
            </span>

            {/* Spacer with fixed width for symmetry */}
            <div className="w-11 h-11" aria-hidden="true" />
          </div>

          {/* Row 2: Phase (left) — Duration (right) */}
          <div className="flex items-center justify-between h-9">
            {currentFlatGroup ? (
              <span className="text-xs text-muted-foreground/80 leading-4">
                {translatePhaseType(currentFlatGroup.phaseType)} · {store.currentGroupIndex + 1}/{store.totalGroups}
              </span>
            ) : (
              <span />
            )}
            <span className="text-xs text-muted-foreground/80 tabular-nums">
              Durata {formatElapsedTime(elapsed)}
            </span>
          </div>

          {/* Row 3: Rest timer (ALWAYS reserved h-8, empty when inactive) */}
          <div
            className={cn(
              "h-8 flex items-center justify-center gap-2 transition-opacity duration-150",
              showRest ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={!showRest}
          >
            {showRest ? (
              <>
                <span className="text-xs text-muted-foreground">Recupero</span>
                <span className="text-base font-mono font-semibold tabular-nums text-primary">
                  {formatRestTime(clampedRest)}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main scroll container (ONLY scrollable element) */}
      <main
        ref={mainRef}
        className="flex-1 min-h-0 overflow-y-auto"
        onScroll={(e) => {
          const next = e.currentTarget.scrollTop > 0;
          setIsScrolled((prev) => (prev === next ? prev : next));
        }}
        style={{ paddingTop: effectiveHeaderHeight + 8 }}
      >
        <div className="px-4 pb-6 max-w-[520px] mx-auto w-full">
          {/* Group Header - pills + badge */}
          {currentFlatGroup && (
            <div className="flex items-center justify-between gap-2 mt-2 mb-3">
              {/* Left: Group type pill (only for superset/circuit) */}
              {groupTypeLabel ? (
                <span className="h-8 text-sm font-medium bg-primary/10 text-primary rounded-full px-3 flex items-center">
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

          {/* Group Card */}
          {currentFlatGroup && (
            <GroupCard
              flatGroup={currentFlatGroup}
              dayId={snapshot.day.id}
              sessionId={sessionId}
              actuals={actuals}
              onSeriesComplete={handleSetComplete}
            />
          )}
        </div>
      </main>

      {/* Navigation Bar - Always visible, shrink-0 (outside scroll container) */}
      {/* REMOVED redundant counter - already in header Row 2 */}
      <nav className="shrink-0 h-12 border-t border-border/40 bg-background px-4 flex items-center justify-between">
        <button
          onClick={() => store.prevGroup()}
          disabled={!canGoPrev}
          className={cn(
            "h-10 px-1 text-sm font-medium text-muted-foreground flex items-center gap-1",
            !canGoPrev && "opacity-40 pointer-events-none"
          )}
        >
          <ChevronLeft className="size-4" />
          Precedente
        </button>

        <button
          onClick={() => store.nextGroup()}
          disabled={!canGoNext}
          className={cn(
            "h-10 px-1 text-sm font-medium text-muted-foreground flex items-center gap-1",
            !canGoNext && "opacity-40 pointer-events-none"
          )}
        >
          Successivo
          <ChevronRight className="size-4" />
        </button>
      </nav>

      {/* Footer - Dynamic styling based on completion */}
      <footer className="shrink-0 bg-background px-4 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] border-t border-border/40">
        <Button
          onClick={() => setShowFinishDialog(true)}
          variant={isLastGroupComplete ? "default" : "outline"}
          className={cn(
            "w-full h-11 rounded-2xl text-sm font-semibold gap-2",
            !isLastGroupComplete && "text-muted-foreground border-border"
          )}
        >
          <Check className="size-4" />
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
