import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ClientEmptyState } from "@/components/client/ClientEmptyState";
import { SessionHistoryCard } from "./SessionHistoryCard";
import { ClientSessionDetailSheet } from "./ClientSessionDetailSheet";
import type { ClientSession } from "../api/client-sessions.api";
import type { ClientActivePlan } from "../api/client-plans.api";
import { countDayExercises } from "../utils/plan-utils";

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
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
          Storico sessioni
        </p>
        <div className="space-y-2">
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
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Storico sessioni
        </p>
        {hasMore && !showAll && (
          <Button 
            variant="link" 
            size="sm" 
            className="h-auto p-0 text-xs"
            onClick={() => setShowAll(true)}
          >
            Mostra tutti
          </Button>
        )}
      </div>

      {!sessions || sessions.length === 0 ? (
        <Card className="border-dashed shadow-sm">
          <CardContent className="p-5">
            <ClientEmptyState
              icon={History}
              title="Nessuna sessione registrata"
              description="Le tue sessioni di allenamento appariranno qui"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {displayedSessions?.map((session) => {
            const day = session.day_id && plan?.data?.days
              ? plan.data.days.find(d => d.id === session.day_id)
              : null;

            const title = day?.title || "Sessione di allenamento";
            const totalExercises = day ? countDayExercises(day) : 0;
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
