import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Activity, FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { format, parseISO, differenceInSeconds } from "date-fns";
import { it } from "date-fns/locale";
import { listSessions } from "../api/sessions.api";
import { listActuals } from "../api/actuals.api";
import type { TrainingSessionWithClient } from "../types";

interface SessionHistoryTabProps {
  clientId: string;
}

export function SessionHistoryTab({ clientId }: SessionHistoryTabProps) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions", clientId],
    queryFn: () => listSessions({ client_id: clientId }),
  });

  const { data: expandedActuals = [] } = useQuery({
    queryKey: ["actuals", expandedSession],
    queryFn: () => listActuals(expandedSession!),
    enabled: !!expandedSession,
  });

  const formatDuration = (startAt?: string, endAt?: string) => {
    if (!startAt || !endAt) return "—";
    const seconds = differenceInSeconds(parseISO(endAt), parseISO(startAt));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      completed: { variant: "default", label: "Completata" },
      in_progress: { variant: "secondary", label: "In corso" },
      planned: { variant: "outline", label: "Pianificata" },
      no_show: { variant: "destructive", label: "No show" },
    };
    const config = variants[status] || variants.planned;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={Activity}
            title="Nessuna sessione registrata"
            description="Non ci sono sessioni di allenamento registrate per questo cliente."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Storico sessioni</h3>
        <Badge variant="secondary">{sessions.length} sessioni</Badge>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <Card key={session.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(session.status)}
                      {session.started_at && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(session.started_at), "dd MMM yyyy", { locale: it })}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Durata: {formatDuration(session.started_at, session.ended_at)}</span>
                      </div>
                      {session.day_id && (
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span>Giorno {session.day_id.split("-")[0] || "—"}</span>
                        </div>
                      )}
                    </div>

                    {session.notes && (
                      <div className="text-sm text-muted-foreground flex items-start gap-2 border-t pt-2">
                        <FileText className="h-4 w-4 shrink-0 mt-0.5" />
                        <p className="flex-1">{session.notes}</p>
                      </div>
                    )}
                  </div>

                  {session.status === "completed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                    >
                      {expandedSession === session.id ? "Nascondi" : "Dettagli"}
                    </Button>
                  )}
                </div>

                {expandedSession === session.id && expandedActuals.length > 0 && (
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-sm font-medium">Serie completate ({expandedActuals.length})</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {expandedActuals.slice(0, 10).map((actual, idx) => (
                        <div key={actual.id} className="flex items-center justify-between py-1">
                          <span>Serie {actual.set_index}</span>
                          <span>
                            {actual.reps} reps
                            {actual.load && ` @ ${actual.load}`}
                          </span>
                        </div>
                      ))}
                      {expandedActuals.length > 10 && (
                        <p className="text-xs text-center pt-1">
                          ... e altre {expandedActuals.length - 10} serie
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
