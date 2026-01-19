/**
 * Client Live Session Page
 * 
 * Mobile-first UI for autonomous client workout tracking.
 * Renders exercises from session.plan_day_snapshot.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Check, Undo2, X, Timer, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
} from '@/features/session-tracking/hooks/useClientSessionTracking';
import { useClientSessionStore } from '@/stores/useClientSessionStore';
import type { PlanDaySnapshot, SnapshotExercise, SnapshotPhase, SnapshotGroup } from '@/features/session-tracking/core/types';
import type { ExerciseActual } from '@/features/sessions/types';

// ================== Timer Component ==================

function SessionTimer() {
  const store = useClientSessionStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(store.getElapsedSeconds());
    }, 1000);

    return () => clearInterval(interval);
  }, [store]);

  return (
    <div className="flex items-center gap-2 text-lg font-mono font-semibold">
      <Timer className="h-5 w-5 text-primary" />
      <span>{formatElapsedTime(elapsed)}</span>
    </div>
  );
}

// ================== Exercise Card ==================

interface ExerciseCardProps {
  exercise: SnapshotExercise;
  dayId: string;
  phaseType: string;
  groupId: string;
  sessionId: string;
  actuals: ExerciseActual[];
  onSetComplete: () => void;
}

function ExerciseCard({
  exercise,
  dayId,
  phaseType,
  groupId,
  sessionId,
  actuals,
  onSetComplete,
}: ExerciseCardProps) {
  const [reps, setReps] = useState(exercise.reps || '');
  const [load, setLoad] = useState('');
  const [rest, setRest] = useState(exercise.rest_seconds?.toString() || '');

  const { mutate: completeSet, isPending: isCompleting } = useCompleteClientSet(sessionId);
  const { mutate: undoLastSet, isPending: isUndoing } = useUndoClientLastSet(sessionId);

  // Filter actuals for this exercise
  const exerciseActuals = actuals.filter(a => a.exercise_id === exercise.id);
  const completedSets = exerciseActuals.length;
  const nextSetIndex = completedSets + 1;

  const handleCompleteSet = () => {
    completeSet(
      {
        day_id: dayId,
        section_id: phaseType,
        group_id: groupId,
        exercise_id: exercise.id,
        set_index: nextSetIndex,
        reps,
        load: load || undefined,
        rest: rest || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Serie ${nextSetIndex} completata!`);
          onSetComplete();
        },
        onError: (error) => {
          toast.error(error.message || 'Errore nel salvataggio');
        },
      }
    );
  };

  const handleUndo = () => {
    undoLastSet(exercise.id, {
      onSuccess: () => {
        toast.success('Ultima serie annullata');
      },
      onError: (error) => {
        toast.error(error.message || 'Errore');
      },
    });
  };

  const allSetsCompleted = completedSets >= exercise.sets;

  return (
    <Card className={cn(
      'transition-all',
      allSetsCompleted && 'opacity-60 border-green-500/50'
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {exercise.name || 'Esercizio'}
          </CardTitle>
          <Badge variant={allSetsCompleted ? 'default' : 'secondary'}>
            {completedSets} / {exercise.sets}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {exercise.sets} x {exercise.reps}
          {exercise.rest_seconds && ` • ${exercise.rest_seconds}s rec.`}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Input Row */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Ripetizioni</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="h-10 text-center"
              placeholder={exercise.reps}
            />
          </div>
          <div>
            <Label className="text-xs">Carico (kg)</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={load}
              onChange={(e) => setLoad(e.target.value)}
              className="h-10 text-center"
              placeholder="0"
            />
          </div>
          <div>
            <Label className="text-xs">Rec. (sec)</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={rest}
              onChange={(e) => setRest(e.target.value)}
              className="h-10 text-center"
              placeholder={exercise.rest_seconds?.toString() || '60'}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleCompleteSet}
            disabled={isCompleting || !reps || allSetsCompleted}
            className="flex-1"
            size="lg"
          >
            {isCompleting ? (
              'Salvataggio...'
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Completa serie {nextSetIndex}
              </>
            )}
          </Button>
          {completedSets > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleUndo}
              disabled={isUndoing}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ================== Phase Section ==================

interface PhaseSectionProps {
  phase: SnapshotPhase;
  dayId: string;
  sessionId: string;
  actuals: ExerciseActual[];
  onSetComplete: () => void;
}

function PhaseSection({ phase, dayId, sessionId, actuals, onSetComplete }: PhaseSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {phase.type}
      </h3>
      {phase.groups.map((group) => (
        <div key={group.id} className="space-y-2">
          {group.label && (
            <p className="text-xs font-medium text-muted-foreground">{group.label}</p>
          )}
          {group.exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              dayId={dayId}
              phaseType={phase.type}
              groupId={group.id}
              sessionId={sessionId}
              actuals={actuals}
              onSetComplete={onSetComplete}
            />
          ))}
        </div>
      ))}
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
        <div className="flex items-center justify-center mt-2">
          <SessionTimer />
          {store.isPaused && (
            <Badge variant="secondary" className="ml-2">
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
            onSetComplete={() => refetchActuals()}
          />
        ))}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 space-y-2">
        <Button
          onClick={() => setShowFinishDialog(true)}
          className="w-full"
          size="lg"
        >
          <Check className="mr-2 h-5 w-5" />
          Termina allenamento
        </Button>
        <Button
          variant="ghost"
          onClick={() => setShowDiscardDialog(true)}
          className="w-full text-muted-foreground"
          size="sm"
        >
          Abbandona sessione
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
