import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { History, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ClientEmptyState } from "@/components/client/ClientEmptyState";
import { SessionHistoryCard } from "./SessionHistoryCard";
import { ClientSessionDetailSheet } from "./ClientSessionDetailSheet";
import type { ClientSession } from "../api/client-sessions.api";
import type { ClientActivePlan } from "../api/client-plans.api";
import { countDayExercises } from "../utils/plan-utils";
import { countExercisesFromDayStructure } from "../utils/countExercisesFromDayStructure";

interface SessionHistorySectionProps {
  sessions: ClientSession[] | undefined;
  plan: ClientActivePlan | null | undefined;
  isLoading: boolean;
}

export function SessionHistorySection({ sessions, plan, isLoading }: SessionHistorySectionProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Allenamenti completati
          </p>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </section>
    );
  }

  const selectedSession = sessions?.find(s => s.id === selectedSessionId);
  const displayedSessions = showAll ? sessions : sessions?.slice(0, 3);
  const hasMore = (sessions?.length || 0) > 3;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Allenamenti completati
          </p>
        </div>
        {hasMore && !showAll && (
          <Button 
            variant="link" 
            size="sm" 
            className="h-auto p-0 text-sm text-primary font-medium"
            onClick={() => setShowAll(true)}
          >
            Mostra tutti
          </Button>
        )}
      </div>

      {!sessions || sessions.length === 0 ? (
        <Card className="border-dashed shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <ClientEmptyState
              icon={History}
              title="Nessuna sessione registrata"
              description="Le tue sessioni di allenamento appariranno qui."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
        {displayedSessions?.map((session) => {
            // Snapshot-first: use snapshot as primary source, fallback to active plan
            const snapshot = session.plan_day_snapshot;
            const dayFromPlan = !snapshot && session.day_id && plan?.data?.days
              ? plan.data.days.find(d => d.id === session.day_id)
              : null;

            const title = snapshot?.day_title ?? dayFromPlan?.title ?? "Sessione di allenamento";
            
            const totalExercises = snapshot?.day_structure 
              ? countExercisesFromDayStructure(snapshot.day_structure)
              : (dayFromPlan ? countDayExercises(dayFromPlan) : 0);
            
            // For now, we use totalExercises as completed since we don't have partial tracking yet
            const completedExercises = totalExercises;

            const formattedDate = session.started_at 
              ? format(new Date(session.started_at), "d MMM yyyy", { locale: it })
              : "Data non disponibile";

            return (
              <SessionHistoryCard
                key={session.id}
                title={title}
                date={formattedDate}
                completedExercises={completedExercises}
                totalExercises={totalExercises}
                onClick={() => setSelectedSessionId(session.id)}
              />
            );
          })}
        </div>
      )}

      <ClientSessionDetailSheet
        session={selectedSession || null}
        plan={plan}
        open={!!selectedSessionId}
        onOpenChange={(open) => !open && setSelectedSessionId(null)}
      />
    </section>
  );
}
