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
import { ArrowLeft, Check, Undo2, Dumbbell, ChevronLeft, ChevronRight, StopCircle } from 'lucide-react';
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
  useCompleteSupersetSeries,
  useUndoSupersetLastSeries,
  useDiscardClientSessionWithCleanup,
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
  // Target line: show only reps target (no rest info here)
  const repsDisplay = exercise.reps ? `${exercise.reps} rip` : '';
  const targetDisplay = repsDisplay ? `Target · ${repsDisplay}` : `Target · ${exercise.sets} serie`;

  return (
    <div className={cn(showDivider && "pt-4 border-t border-border/40")}>
      {/* Exercise Name */}
      <h4 className="text-base font-semibold leading-6">
        {exercise.name || 'Esercizio'}
      </h4>
      
      {/* Target - no rest info */}
      <p className="text-sm text-muted-foreground leading-5">
        {targetDisplay}
      </p>
      
      {/* Inputs - 44px height, 16px font */}
      <div className="grid grid-cols-2 gap-4 mt-3">
        <div>
          <label className="text-xs tracking-wide text-muted-foreground block">REPS</label>
          <Input
            type="text"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="mt-2 h-11 rounded-[10px] text-base px-3 bg-muted/30 border-border focus:border-primary focus:ring-1 focus:ring-primary/30"
            placeholder={exercise.reps || '—'}
          />
        </div>
        <div>
          <label className="text-xs tracking-wide text-muted-foreground block">CARICO</label>
          <Input
            type="text"
            inputMode="decimal"
            value={load}
            onChange={(e) => setLoad(e.target.value)}
            className="mt-2 h-11 rounded-[10px] text-base px-3 bg-muted/30 border-border focus:border-primary focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/60"
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
  
  // Do NOT clamp display: show actual completed (can exceed target)
  const isComplete = completed >= target && target > 0;

  // Dev warning for data integrity
  if (import.meta.env.DEV && completed > target) {
    console.warn(`[SeriesBadge] completed (${completed}) > target (${target})`);
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center h-6 px-2 py-1 rounded-full text-xs font-medium leading-4",
        isComplete
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-muted text-muted-foreground"
      )}
    >
      Serie {completed}/{target}
      {isComplete ? <span className="ml-1">✓</span> : null}
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
  
  const store = useClientSessionStore();
  
  // Initialize drafts for exercises in this group if not already set
  useEffect(() => {
    group.exercises.forEach(ex => {
      if (!store.draftByExerciseId[ex.id]) {
        store.setDraft(ex.id, { reps: ex.reps || '', load: '' });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id]);

  // Get input values from store drafts
  const getInputValue = (exerciseId: string, field: 'reps' | 'load'): string => {
    return store.draftByExerciseId[exerciseId]?.[field] ?? '';
  };

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
  let maxSetIndex = 0;
  setIndexMap.forEach((exerciseSet, setIndex) => {
    if (exerciseSet.size === numExercises) {
      completedSeries++;
      maxSetIndex = Math.max(maxSetIndex, setIndex);
    }
  });
  
  const targetSeries = Math.min(...group.exercises.map(e => e.sets));
  const MAX_SERIES_LIMIT = 30;
  // Use MAX set_index + 1 to prevent overwrites after Undo
  const nextSeriesIndex = maxSetIndex + 1;
  const restSeconds = group.exercises[0]?.rest_seconds || 60;

  const handleComplete = () => {
    // Prevent recording beyond 30 series
    if (nextSeriesIndex > MAX_SERIES_LIMIT) {
      toast.info('Hai raggiunto il limite massimo di 30 serie');
      return;
    }
    
    if (isMultiExercise) {
      // Batch complete for superset/circuit
      const inputs = group.exercises.map(ex => ({
        day_id: dayId,
        section_id: phaseType,
        group_id: group.id,
        exercise_id: ex.id,
        set_index: nextSeriesIndex,
        reps: getInputValue(ex.id, 'reps') || ex.reps || '',
        load: getInputValue(ex.id, 'load') || undefined,
        rest: restSeconds.toString(),
      }));

      completeSeries(inputs, {
        onSuccess: () => {
          // Reset drafts for this group after successful completion
          group.exercises.forEach(ex => {
            store.setDraft(ex.id, { reps: ex.reps || '', load: '' });
          });
          store.touch();
          onSeriesComplete(restSeconds, group.id);
        },
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
          reps: getInputValue(exercise.id, 'reps') || exercise.reps || '',
          load: getInputValue(exercise.id, 'load') || undefined,
          rest: restSeconds.toString(),
        },
        {
          onSuccess: () => {
            // Reset draft for this exercise after successful completion
            store.setDraft(exercise.id, { reps: exercise.reps || '', load: '' });
            store.touch();
            onSeriesComplete(restSeconds, group.id);
          },
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

  const allRepsFilled = group.exercises.every(ex => {
    const reps = getInputValue(ex.id, 'reps');
    return reps && reps.trim() !== '';
  });

  return (
    <>
      {/* Card container - Notion-like, soft border */}
      <div className="p-3.5 rounded-2xl bg-background border border-border/60 space-y-3">
        {/* Exercises */}
        {group.exercises.map((exercise, idx) => (
          <ExerciseBlock
            key={exercise.id}
            exercise={exercise}
            reps={getInputValue(exercise.id, 'reps') || exercise.reps || ''}
            setReps={(value) => store.setDraft(exercise.id, { reps: value })}
            load={getInputValue(exercise.id, 'load')}
            setLoad={(value) => store.setDraft(exercise.id, { load: value })}
            showDivider={idx > 0}
          />
        ))}

        {/* CTA Block - FIRST, before history */}
        <div className="mt-3 space-y-2">
          <Button
            onClick={handleComplete}
            disabled={isCompleting || !allRepsFilled || nextSeriesIndex > MAX_SERIES_LIMIT}
            className="w-full h-14 rounded-[14px] text-base font-medium leading-6 tracking-normal gap-2"
          >
            <Check className="h-[18px] w-[18px] opacity-90" strokeWidth={2} />
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
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

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

  // TTL cleanup: clear stale store data (> 12 hours)
  useEffect(() => {
    const TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
    const updatedAt = store.updatedAtMs;
    if (updatedAt && Date.now() - updatedAt > TTL_MS) {
      store.clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Removed showFinishDialog - now unified in showLeaveDialog

  // Queries
  const { data: activeSession, isLoading: isActiveLoading } = useClientActiveSession();
  const sessionId = sessionIdFromUrl || activeSession?.id || store.activeSessionId;
  const { data: sessionDetail, isLoading: isDetailLoading } = useClientSessionDetail(sessionId || undefined);
  const { data: actuals = [], refetch: refetchActuals } = useClientSessionActuals(sessionId || undefined);

  // Mutations
  const { mutate: finishSession, isPending: isFinishing } = useFinishClientSession();
  const { mutate: discardWithCleanup, isPending: isDiscarding } = useDiscardClientSessionWithCleanup();

  // Guard anti-cross-session: robust sync store with DB
  useEffect(() => {
    if (!sessionDetail || !sessionDetail.started_at) return;

    const dbId = sessionDetail.id;
    const dbStartedAt = sessionDetail.started_at;

    if (!store.activeSessionId) {
      // Store empty → sync
      store.syncWithSession(dbId, dbStartedAt);
      store.touch();
      return;
    }

    if (store.activeSessionId !== dbId) {
      // Store has different session → clear and re-sync
      store.clear();
      store.syncWithSession(dbId, dbStartedAt);
      store.touch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Handler: Continue workout (close dialog)
  const handleContinue = () => {
    setShowLeaveDialog(false);
  };

  // Handler: End workout (save as completed)
  const handleEndWorkout = () => {
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

  // Handler: Exit without saving (discard + delete actuals)
  const handleExitWithoutSaving = () => {
    if (!sessionId) return;
    discardWithCleanup(sessionId, {
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

  // Exit confirmation logic
  const hasDraft = Object.keys(store.draftByExerciseId).some(key => {
    const draft = store.draftByExerciseId[key];
    return draft?.reps?.trim() || draft?.load?.trim();
  });
  const hasRest = store.isRestActive();
  const hasCompleted = actuals.length > 0;
  const shouldConfirmExit = hasDraft || hasRest || hasCompleted;

  // Handle exit (back button)
  const handleExitClick = () => {
    if (shouldConfirmExit) {
      setShowLeaveDialog(true);
    } else {
      navigate('/client/app/workouts');
    }
  };

  // Intercept system back (browser/mobile)
  useEffect(() => {
    if (!sessionId) return;
    
    // Push dummy state to enable popstate interception
    window.history.pushState({ sessionActive: true }, '');

    const handlePopState = () => {
      if (shouldConfirmExit) {
        // Re-push state to prevent navigation
        window.history.pushState({ sessionActive: true }, '');
        setShowLeaveDialog(true);
      } else {
        navigate('/client/app/workouts');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [sessionId, shouldConfirmExit, navigate]);

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

  // Group type label - use label directly if available, else prefix with type
  const getGroupTypeLabel = () => {
    if (!currentFlatGroup) return null;
    const { group } = currentFlatGroup;
    if (group.type === 'superset') return group.label || 'Superset';
    if (group.type === 'circuit') return group.label || 'Circuit';
    return null;
  };

  const groupTypeLabel = getGroupTypeLabel();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Top Bar - Stable 2-row layout, 96px fixed */}
      <header
        ref={headerRef}
        className="sticky top-0 z-20 bg-background border-b border-border pt-[env(safe-area-inset-top)]"
      >
        <div className="h-24 px-4 flex flex-col">
          {/* Row 1 - 56px, grid for perfect centering */}
          <div className="h-14 grid grid-cols-[44px_1fr_44px] items-center">
            {/* Left: back button */}
            <button
              type="button"
              onClick={handleExitClick}
              className="min-h-[44px] w-11 -ml-1 inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Indietro"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Center: title */}
            <div className="min-w-0 text-center">
              <div className="text-base font-semibold leading-6 truncate">
                {snapshot?.day?.title || "Allenamento"}
              </div>
            </div>

            {/* Right: duration (no label) */}
            <div className="min-h-[44px] inline-flex items-center justify-end text-sm text-muted-foreground tabular-nums">
              {formatElapsedTime(elapsed)}
            </div>
          </div>

          {/* Row 2 - 40px */}
          <div className="h-10 flex items-baseline justify-between pt-2">
            <div className="text-sm text-muted-foreground truncate">
              {currentFlatGroup ? (
                <span className="truncate">
                  {translatePhaseType(currentFlatGroup.phaseType)} · {store.currentGroupIndex + 1}/{store.totalGroups}
                </span>
              ) : (
                <span className="truncate">&nbsp;</span>
              )}
            </div>

            {/* Right: Rest — fixed width, single-line, baseline-aligned */}
            <div className="w-[132px] flex items-baseline justify-end gap-2 tabular-nums">
              <span className="text-sm text-muted-foreground">Recupero</span>
              <span
                className={cn(
                  showRest && clampedRest > 0 
                    ? "text-lg text-primary font-semibold leading-none" 
                    : "text-sm text-muted-foreground"
                )}
              >
                {formatRestTime(clampedRest)}
              </span>
            </div>
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
      >
        <div className="px-4 pt-6 pb-6 max-w-[520px] mx-auto w-full">
          {/* Group Header - simple text + badge */}
          {currentFlatGroup && (
            <div className="flex items-center justify-between gap-2 mb-3">
              {/* Left: Group type text (only for superset/circuit) */}
              {groupTypeLabel ? (
                <div className="text-sm font-medium text-foreground">
                  {groupTypeLabel}
                </div>
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

      {/* Bottom Bar - Nav + Termina unified, no empty space */}
      <div className="sticky bottom-0 z-20 bg-background border-t border-border px-4 py-2 space-y-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
          {/* Nav row */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => store.prevGroup()}
              disabled={!canGoPrev}
              className={cn(
                "min-h-[44px] px-3 py-2 rounded-lg",
                "inline-flex items-center gap-1",
                "text-sm font-medium text-foreground/70",
                "bg-muted/30",
                "cursor-pointer select-none",
                "active:bg-muted/50",
                "focus-visible:bg-muted/50 focus-visible:outline-none",
                "transition-colors",
                !canGoPrev && "opacity-40 pointer-events-none"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Precedente</span>
            </button>

            <button
              type="button"
              onClick={() => store.nextGroup()}
              disabled={!canGoNext}
              className={cn(
                "min-h-[44px] px-3 py-2 rounded-lg",
                "inline-flex items-center gap-1",
                "text-sm font-medium text-foreground/70",
                "bg-muted/30",
                "cursor-pointer select-none",
                "active:bg-muted/50",
                "focus-visible:bg-muted/50 focus-visible:outline-none",
                "transition-colors",
                !canGoNext && "opacity-40 pointer-events-none"
              )}
            >
              <span>Successivo</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Termina row */}
          <button
            type="button"
            onClick={() => setShowLeaveDialog(true)}
            className={cn(
              "w-full min-h-[44px] px-3 py-2 rounded-lg",
              "inline-flex items-center justify-center gap-2",
              "text-sm font-medium text-destructive/70",
              "bg-destructive/5",
              "cursor-pointer select-none",
              "active:bg-destructive/10",
              "focus-visible:bg-destructive/10 focus-visible:outline-none",
              "transition-colors"
            )}
          >
            <StopCircle className="h-4 w-4" />
            <span>Termina allenamento</span>
          </button>
      </div>


      {/* Unified Leave Dialog - 3 actions */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent className="w-[calc(100%-32px)] max-w-[420px] rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold leading-7">
              Uscire dall'allenamento?
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-sm leading-5 text-muted-foreground" asChild>
              <div className="space-y-1.5">
                {actuals.length > 0 ? (
                  <>
                    <p>Se termini l'allenamento, le serie completate verranno salvate.</p>
                    <p className="text-destructive/70">
                      Esci senza salvare elimina le serie registrate in questa sessione.
                    </p>
                  </>
                ) : (
                  <p>Non hai ancora completato nessuna serie.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="mt-6 flex flex-col gap-3">
            {/* PRIMARY: Continue — safe action, filled, h-14 */}
            <Button 
              onClick={handleContinue}
              className="w-full h-14 rounded-xl text-base font-medium leading-6"
            >
              Continua allenamento
            </Button>
            
            {/* SECONDARY: End workout — save, outline, h-12 */}
            <Button 
              variant="outline"
              onClick={handleEndWorkout}
              disabled={isFinishing}
              className="w-full h-12 rounded-xl text-base font-medium leading-6"
            >
              {isFinishing ? 'Salvataggio...' : 'Termina allenamento'}
            </Button>
            
            {/* DESTRUCTIVE: Exit without saving — text-style, intentionally smaller */}
            <button
              type="button"
              onClick={handleExitWithoutSaving}
              disabled={isDiscarding}
              className="mt-4 w-full min-h-[44px] rounded-lg text-sm font-medium leading-5 text-destructive/70 hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50"
            >
              {isDiscarding ? 'Uscita...' : 'Esci senza salvare'}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
