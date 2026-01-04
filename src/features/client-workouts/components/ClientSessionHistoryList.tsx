import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { History, User, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ClientHistoryItem } from "@/components/client/ClientHistoryItem";
import { ClientEmptyState } from "@/components/client/ClientEmptyState";
import { ClientSessionDetailSheet } from "./ClientSessionDetailSheet";
import type { ClientSession } from "../api/client-sessions.api";
import type { ClientActivePlan } from "../api/client-plans.api";
import type { PlanDaySnapshot } from "@/features/client-plans/types";

interface ClientSessionHistoryListProps {
  sessions: ClientSession[] | undefined;
  plan: ClientActivePlan | null | undefined;
  isLoading: boolean;
}

export function ClientSessionHistoryList({ sessions, plan, isLoading }: ClientSessionHistoryListProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card className="border-dashed shadow-sm">
        <CardContent className="p-5">
          <ClientEmptyState
            icon={History}
            title="Nessuna sessione registrata"
            description="Le tue sessioni di allenamento appariranno qui"
          />
        </CardContent>
      </Card>
    );
  }

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  return (
    <>
      <div className="divide-y">
        {sessions.map((session) => {
          const startDate = session.started_at ? new Date(session.started_at) : null;
          const endDate = session.ended_at ? new Date(session.ended_at) : null;
          
          const formattedDate = startDate 
            ? format(startDate, "EEEE d MMM", { locale: it })
            : "Data non disponibile";
          
          const formattedTime = startDate && endDate
            ? `${format(startDate, "HH:mm")} – ${format(endDate, "HH:mm")}`
            : startDate
              ? format(startDate, "HH:mm")
              : undefined;

          // Use snapshot first (immutable history), then fallback to current plan
          const snapshot = (session as any).plan_day_snapshot as PlanDaySnapshot | null;
          const dayName = snapshot?.day_title 
            || (session.day_id && plan?.data?.days
                ? plan.data.days.find(d => d.id === session.day_id)?.title
                : undefined)
            || "Sessione di allenamento";

          const isWithCoach = session.source === "with_coach";

          return (
            <ClientHistoryItem
              key={session.id}
              title={dayName}
              subtitle={undefined}
              date={formattedDate}
              time={formattedTime}
              badge={{
                label: isWithCoach ? "Con coach" : "Da solo",
                variant: "secondary",
                icon: isWithCoach ? UserCheck : User
              }}
              onClick={() => setSelectedSessionId(session.id)}
            />
          );
        })}
      </div>

      <ClientSessionDetailSheet
        session={selectedSession || null}
        plan={plan}
        open={!!selectedSessionId}
        onOpenChange={(open) => !open && setSelectedSessionId(null)}
      />
    </>
  );
}
