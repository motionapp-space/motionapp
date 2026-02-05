import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, Calendar, UserCheck, UserX, CalendarPlus, Play, X } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { TabHeader } from "@/components/ui/tab-header";
import { format, parseISO, differenceInSeconds } from "date-fns";
import { it } from "date-fns/locale";
import { listSessions } from "../api/sessions.api";
import { useUpdateSession } from "../hooks/useUpdateSession";
import { useSessionStore } from "@/stores/useSessionStore";
import type { TrainingSessionWithClient } from "../types";
import { SessionDetailDrawer } from "./SessionDetailDrawer";
import { cn } from "@/lib/utils";
import { getCoachClientId } from "@/lib/coach-client";
import { toast } from "sonner";

interface SessionHistoryTabProps {
  clientId: string;
}

export function SessionHistoryTab({ clientId }: SessionHistoryTabProps) {
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const clearActiveSession = useSessionStore((s) => s.clearActiveSession);
  const activeSession = useSessionStore((s) => s.activeSession);
  const { mutateAsync: updateSession } = useUpdateSession();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions", clientId],
    queryFn: async () => {
      const coachClientId = await getCoachClientId(clientId);
      return listSessions({ coach_client_id: coachClientId });
    },
    enabled: !!clientId,
  });

  // Separate sessions by source
  const withCoachSessions = sessions.filter((s) => s.source === "with_coach");
  const autonomousSessions = sessions.filter((s) => s.source === "autonomous");

  const formatDuration = (startAt?: string, endAt?: string) => {
    if (!startAt || !endAt) return "—";
    const seconds = differenceInSeconds(parseISO(endAt), parseISO(startAt));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    // If duration is abnormally long (>8h), show warning
    if (hours >= 8) {
      return "Durata anomala";
    }
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getStatusBadge = (status: string) => {
    // Only show badges for non-completed sessions
    switch (status) {
      case "in_progress":
        return (
          <Badge 
            variant="secondary" 
            className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-foreground"
          >
            In corso
          </Badge>
        );
      case "discarded":
        return (
          <Badge 
            variant="outline" 
            className="text-xs font-medium px-2 py-0.5 rounded-full text-muted-foreground"
          >
            Scartata
          </Badge>
        );
      default:
        return null; // completed sessions show no badge
    }
  };

  const handleResume = async (session: TrainingSessionWithClient) => {
    // Inject into Zustand store
    setActiveSession(session);
    // Navigate to live session
    navigate(`/session/live?sessionId=${session.id}`);
  };

  const handleDiscard = async (session: TrainingSessionWithClient) => {
    try {
      await updateSession({
        id: session.id,
        updates: {
          status: "discarded",
          ended_at: new Date().toISOString(),
        },
      });
      
      // If this was the active session, clear it
      if (activeSession?.id === session.id) {
        clearActiveSession();
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      
      toast.success("Sessione chiusa");
    } catch (error) {
      toast.error("Errore nel chiudere la sessione");
    }
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
      {/* Header uniforme - NESSUNA CTA */}
      <TabHeader
        title="Sessioni di allenamento"
        subtitle="Allenamenti registrati, svolti con te o in autonomia dal cliente tramite l'app"
      />

      {/* Microcopy educativo - sempre visibile */}
      <div className="text-xs text-foreground/80 bg-muted/50 rounded-lg px-4 py-3 space-y-1">
        <p>Le sessioni di allenamento si registrano da un appuntamento in calendario.</p>
        <p>Il cliente può anche registrare sessioni in autonomia dall'app.</p>
      </div>

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
          {withCoachSessions.length === 0 ? (
            <Card>
              <CardContent className="p-0">
                <EmptyState
                  icon={CalendarPlus}
                  title="Nessuna sessione di allenamento registrata"
                  description="Le sessioni vengono registrate durante un appuntamento oppure direttamente dal cliente tramite l'app."
                  secondaryAction={{
                    label: "Vai agli appuntamenti",
                    onClick: () => navigate(`/clients/${clientId}?tab=appointments`)
                  }}
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
                  onResume={() => handleResume(session)}
                  onDiscard={() => handleDiscard(session)}
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
              <h3 className="text-base font-semibold leading-6 text-foreground mb-4">
                Sessioni svolte dal cliente in autonomia
              </h3>

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
                  onResume={() => handleResume(session)}
                  onDiscard={() => handleDiscard(session)}
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
  session: TrainingSessionWithClient & { plan_day_snapshot?: { plan_name?: string } | null };
  onViewDetails: () => void;
  onResume: () => void;
  onDiscard: () => void;
  isReadOnly: boolean;
  formatDuration: (startAt?: string, endAt?: string) => string;
  getStatusBadge: (status: string) => JSX.Element | null;
}

function SessionCard({
  session,
  onViewDetails,
  onResume,
  onDiscard,
  isReadOnly,
  formatDuration,
  getStatusBadge,
}: SessionCardProps) {
  const isInProgress = session.status === "in_progress";
  const isDiscarded = session.status === "discarded";
  const planName = (session as any).plan_day_snapshot?.plan_name;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-colors",
        isInProgress && "border-l-4 border-l-primary/70 bg-primary/5",
        isDiscarded && "opacity-60",
        !isInProgress && "cursor-pointer hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-primary/20",
        isReadOnly && "opacity-90"
      )}
      onClick={!isInProgress ? onViewDetails : undefined}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
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

              {/* Plan name (replaces "Piano collegato" badge) */}
              {planName && (
                <p className="text-sm text-muted-foreground">
                  Piano: {planName}
                </p>
              )}

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

            {/* CTA per sessioni in_progress - centrate verticalmente */}
            {isInProgress && !isReadOnly && (
              <div className="flex items-center gap-2 self-center shrink-0">
                <Button 
                  size="sm"
                  variant="outline"
                  className="h-9 px-3.5 text-sm font-medium rounded-[10px] gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResume();
                  }}
                >
                  <Play className="h-4 w-4" />
                  Riprendi
                </Button>
                <Button 
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDiscard();
                  }}
                  aria-label="Chiudi sessione"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}