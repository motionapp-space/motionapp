import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, User, UserCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInMinutes } from "date-fns";
import { it } from "date-fns/locale";
import { useClientSessionDetail } from "../hooks/useClientSessionDetail";
import type { ClientSession, PlanDaySnapshot } from "../api/client-sessions.api";
import type { ClientActivePlan } from "../api/client-plans.api";
import type { ExerciseActual } from "@/features/sessions/types";
import { findExerciseNameFromDayStructure, findExerciseNameFromPhases } from "../utils/countExercisesFromDayStructure";
import { useDiscardClientSession } from "@/features/session-tracking/hooks/useClientSessionTracking";

interface ClientSessionDetailSheetProps {
  session: ClientSession | null;
  plan: ClientActivePlan | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GroupedActuals {
  exerciseId: string;
  exerciseName: string;
  sets: ExerciseActual[];
}

/**
 * Groups actuals by exercise and resolves exercise names using snapshot-first approach:
 * 1. Try snapshot.phases (new format from buildPlanDaySnapshot)
 * 2. Try snapshot.day_structure (legacy format)
 * 3. Fallback to active plan
 * 4. Fallback to generic name
 */
function groupActualsByExercise(
  actuals: ExerciseActual[],
  snapshot: PlanDaySnapshot | null,
  plan: ClientActivePlan | null | undefined
): GroupedActuals[] {
  const groups: Record<string, GroupedActuals> = {};

  for (const actual of actuals) {
    if (!groups[actual.exercise_id]) {
      let exerciseName: string | null = null;
      
      // 1. NEW FORMAT: snapshot.phases (from buildPlanDaySnapshot)
      if (snapshot?.phases) {
        exerciseName = findExerciseNameFromPhases(snapshot.phases, actual.exercise_id);
      }
      
      // 2. LEGACY FORMAT: snapshot.day_structure.phases
      if (!exerciseName && snapshot?.day_structure) {
        exerciseName = findExerciseNameFromDayStructure(snapshot.day_structure, actual.exercise_id);
      }
      
      // Fallback to active plan if not found in snapshot
      if (!exerciseName && plan?.data?.days) {
        for (const day of plan.data.days) {
          for (const phase of day.phases || []) {
            for (const group of phase.groups || []) {
              const found = group.exercises?.find(e => e.id === actual.exercise_id);
              if (found?.name) {
                exerciseName = found.name;
                break;
              }
            }
          }
          if (exerciseName) break;
        }
      }

      // Final fallback
      if (!exerciseName) {
        exerciseName = `Esercizio ${actual.exercise_id.slice(0, 8)}`;
      }

      groups[actual.exercise_id] = {
        exerciseId: actual.exercise_id,
        exerciseName,
        sets: [],
      };
    }
    groups[actual.exercise_id].sets.push(actual);
  }

  // Sort sets by set_index
  return Object.values(groups).map(g => ({
    ...g,
    sets: g.sets.sort((a, b) => a.set_index - b.set_index),
  }));
}

function SetLine({ actual, index }: { actual: ExerciseActual; index: number }) {
  const parts: string[] = [];
  
  if (actual.reps) parts.push(`${actual.reps} reps`);
  if (actual.load) parts.push(`@ ${actual.load}`);
  if (actual.rest) parts.push(`rec ${actual.rest}`);
  if (actual.rpe) parts.push(`RPE ${actual.rpe}`);

  return (
    <div className="flex items-baseline gap-2 py-1">
      <span className="text-xs text-muted-foreground w-14 flex-shrink-0">
        Serie {index + 1}
      </span>
      <span className="text-[15px] leading-6 text-foreground">
        {parts.join(" • ") || "—"}
      </span>
    </div>
  );
}

function ExerciseDetail({ group }: { group: GroupedActuals }) {
  return (
    <div className="py-3 border-b border-border/50 last:border-0">
      <p className="font-medium text-[15px] leading-6 text-foreground mb-1">
        {group.exerciseName}
      </p>
      <div className="space-y-0">
        {group.sets.map((actual, i) => (
          <SetLine key={actual.id} actual={actual} index={i} />
        ))}
      </div>
    </div>
  );
}

export function ClientSessionDetailSheet({
  session,
  plan,
  open,
  onOpenChange,
}: ClientSessionDetailSheetProps) {
  const { data: actuals, isLoading } = useClientSessionDetail(
    open && session ? session.id : undefined
  );
  
  const { mutate: discardSession, isPending: isRemoving } = useDiscardClientSession();

  const handleRemoveFromHistory = () => {
    if (!session) return;
    discardSession(session.id, {
      onSuccess: () => {
        toast.success('Sessione rimossa dalla cronologia');
        onOpenChange(false);
      },
      onError: (error: Error) => toast.error(error.message || 'Errore'),
    });
  };

  if (!session) return null;

  const startDate = session.started_at ? new Date(session.started_at) : null;
  const endDate = session.ended_at ? new Date(session.ended_at) : null;
  
  const formattedDate = startDate 
    ? format(startDate, "EEEE d MMMM yyyy", { locale: it })
    : "Data non disponibile";
  
  const duration = startDate && endDate 
    ? differenceInMinutes(endDate, startDate)
    : null;

  const isWithCoach = session.source === "with_coach";
  const grouped = actuals ? groupActualsByExercise(actuals, session.plan_day_snapshot, plan) : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
        <SheetHeader className="text-left pb-4 border-b">
          <SheetTitle className="text-lg capitalize">
            {formattedDate}
          </SheetTitle>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              {isWithCoach ? (
                <>
                  <UserCheck className="h-3 w-3" />
                  Con coach
                </>
              ) : (
                <>
                  <User className="h-3 w-3" />
                  Da solo
                </>
              )}
            </Badge>
            {duration !== null && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {duration} min
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="overflow-y-auto py-4 -mx-6 px-6" style={{ maxHeight: "calc(85vh - 120px)" }}>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : grouped.length === 0 ? (
            <p className="text-[15px] leading-6 text-muted-foreground text-center py-8">
              Nessun esercizio registrato per questa sessione
            </p>
          ) : (
            <div>
              {grouped.map((group) => (
                <ExerciseDetail key={group.exerciseId} group={group} />
              ))}
            </div>
          )}

          {/* Remove from history button */}
          <div className="pt-4 border-t mt-6">
            <button
              type="button"
              onClick={handleRemoveFromHistory}
              disabled={isRemoving}
              className="w-full min-h-[44px] px-3 py-2 text-[15px] leading-6 font-medium text-destructive/70 hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {isRemoving ? 'Rimozione...' : 'Rimuovi dalla cronologia'}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
