import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { History, User, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ClientSessionDetailSheet } from "./ClientSessionDetailSheet";
import type { ClientSession } from "../api/client-sessions.api";
import type { ClientActivePlan } from "../api/client-plans.api";

interface ClientSessionHistoryListProps {
  sessions: ClientSession[] | undefined;
  plan: ClientActivePlan | null | undefined;
  isLoading: boolean;
}

function SessionCard({ 
  session, 
  plan,
  onSelect 
}: { 
  session: ClientSession; 
  plan: ClientActivePlan | null | undefined;
  onSelect: () => void;
}) {
  const startDate = session.started_at ? new Date(session.started_at) : null;
  const endDate = session.ended_at ? new Date(session.ended_at) : null;
  
  const formattedDate = startDate 
    ? format(startDate, "EEEE d MMMM yyyy", { locale: it })
    : "Data non disponibile";
  
  const formattedTime = startDate && endDate
    ? `${format(startDate, "HH:mm")} – ${format(endDate, "HH:mm")}`
    : startDate
      ? format(startDate, "HH:mm")
      : null;

  // Try to find day name from plan
  const dayName = session.day_id && plan?.data?.days
    ? plan.data.days.find(d => d.id === session.day_id)?.title
    : null;

  const isWithCoach = session.source === "with_coach";

  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onSelect}
    >
      <CardContent className="py-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground capitalize">
              {formattedDate}
            </p>
            {formattedTime && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {formattedTime}
              </p>
            )}
            {dayName && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {dayName}
              </p>
            )}
          </div>
          <Badge 
            variant="secondary" 
            className="text-xs flex items-center gap-1 flex-shrink-0"
          >
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
        </div>
      </CardContent>
    </Card>
  );
}

export function ClientSessionHistoryList({ sessions, plan, isLoading }: ClientSessionHistoryListProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <History className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Non hai ancora sessioni registrate
            </p>
            <p className="text-xs text-muted-foreground">
              Le tue sessioni di allenamento appariranno qui
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  return (
    <>
      <div className="space-y-2">
        {sessions.map((session) => (
          <SessionCard 
            key={session.id} 
            session={session}
            plan={plan}
            onSelect={() => setSelectedSessionId(session.id)}
          />
        ))}
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
