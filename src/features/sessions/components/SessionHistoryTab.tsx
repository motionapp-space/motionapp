import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, Calendar, Activity, UserCheck, UserX, Play } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { format, parseISO, differenceInSeconds } from "date-fns";
import { it } from "date-fns/locale";
import { listSessions } from "../api/sessions.api";
import type { TrainingSessionWithClient } from "../types";
import { SessionDetailDrawer } from "./SessionDetailDrawer";
import { cn } from "@/lib/utils";

interface SessionHistoryTabProps {
  clientId: string;
  onStartNewSession?: () => void;
}

export function SessionHistoryTab({ clientId, onStartNewSession }: SessionHistoryTabProps) {
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions", clientId],
    queryFn: () => listSessions({ client_id: clientId }),
  });

  // Separate sessions by source
  const withCoachSessions = sessions.filter((s) => s.source === "with_coach");
  const autonomousSessions = sessions.filter((s) => s.source === "autonomous");

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
      interrupted: { variant: "secondary", label: "Interrotta" },
      cancelled: { variant: "destructive", label: "Annullata" },
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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="with_coach" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="with_coach" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Con PT ({withCoachSessions.length})
            </TabsTrigger>
            <TabsTrigger value="autonomous" className="gap-2">
              <UserX className="h-4 w-4" />
              Autonome ({autonomousSessions.length})
            </TabsTrigger>
          </TabsList>

          <Badge variant="secondary">{sessions.length} sessioni totali</Badge>
        </div>

        {/* Tab: Sessioni Con PT */}
        <TabsContent value="with_coach" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Sessioni svolte insieme al personal trainer
            </p>
            {onStartNewSession && withCoachSessions.length > 0 && (
              <Button onClick={onStartNewSession} size="sm" className="gap-2">
                <Play className="h-4 w-4" />
                Nuova sessione
              </Button>
            )}
          </div>

          {withCoachSessions.length === 0 ? (
            <Card>
              <CardContent className="p-0">
                <EmptyState
                  icon={UserCheck}
                  title="Nessuna sessione con PT"
                  description="Non ci sono ancora sessioni registrate con il personal trainer."
                  action={onStartNewSession ? {
                    label: "Inizia prima sessione",
                    onClick: onStartNewSession
                  } : undefined}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {withCoachSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onViewDetails={() => setDetailSessionId(session.id)}
                  isReadOnly={false}
                  formatDuration={formatDuration}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Sessioni Autonome */}
        <TabsContent value="autonomous" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sessioni svolte dal cliente in autonomia
          </p>

          {autonomousSessions.length === 0 ? (
            <Card>
              <CardContent className="p-0">
                <EmptyState
                  icon={UserX}
                  title="Nessuna sessione autonoma"
                  description="Il cliente non ha ancora registrato sessioni in autonomia."
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {autonomousSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onViewDetails={() => setDetailSessionId(session.id)}
                  isReadOnly={true}
                  formatDuration={formatDuration}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <SessionDetailDrawer
        open={!!detailSessionId}
        onOpenChange={(open) => !open && setDetailSessionId(null)}
        sessionId={detailSessionId || ""}
      />
    </div>
  );
}

// Helper component to render session card
interface SessionCardProps {
  session: TrainingSessionWithClient;
  onViewDetails: () => void;
  isReadOnly: boolean;
  formatDuration: (startAt?: string, endAt?: string) => string;
  getStatusBadge: (status: string) => JSX.Element;
}

function SessionCard({
  session,
  onViewDetails,
  isReadOnly,
  formatDuration,
  getStatusBadge,
}: SessionCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer transition-colors",
        isReadOnly ? "hover:bg-muted/30 opacity-90" : "hover:bg-accent/50"
      )}
      onClick={onViewDetails}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(session.status)}
                {isReadOnly && (
                  <Badge variant="outline" className="text-xs">
                    Solo lettura
                  </Badge>
                )}
                {session.started_at && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(parseISO(session.started_at), "dd MMM yyyy", { locale: it })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 text-sm">
                {session.started_at && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {format(parseISO(session.started_at), "HH:mm", { locale: it })}
                    </span>
                    {session.ended_at && (
                      <>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-muted-foreground">
                          {format(parseISO(session.ended_at), "HH:mm", { locale: it })}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {session.started_at && session.ended_at && (
                  <Badge variant="outline" className="text-xs">
                    {formatDuration(session.started_at, session.ended_at)}
                  </Badge>
                )}
              </div>

              {session.notes && (
                <p className="text-sm text-muted-foreground line-clamp-2">{session.notes}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {session.plan_id && (
                <Badge variant="secondary" className="text-xs">
                  Piano collegato
                </Badge>
              )}
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
