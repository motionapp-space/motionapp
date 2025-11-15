import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Clock, User, Calendar, FileText, Dumbbell } from "lucide-react";
import { useSessionQuery } from "../hooks/useSessionQuery";
import { useActualsQuery } from "../hooks/useActualsQuery";
import { getClientPlan } from "@/features/client-plans/api/client-plans.api";
import { useEffect, useState } from "react";
import type { Day, Phase } from "@/types/plan";
import { migratePhaseToGroups } from "@/types/plan";
import { cn } from "@/lib/utils";

interface SessionDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

export function SessionDetailDrawer({ open, onOpenChange, sessionId }: SessionDetailDrawerProps) {
  const { data: session, isLoading } = useSessionQuery(sessionId);
  const { data: actuals = [] } = useActualsQuery(sessionId);
  const [day, setDay] = useState<Day | null>(null);
  const [planName, setPlanName] = useState("");

  useEffect(() => {
    if (session?.plan_id && session?.day_id) {
      getClientPlan(session.plan_id)
        .then((plan) => {
          setPlanName(plan.name);
          const foundDay = plan.data?.days?.find((d: Day) => d.id === session.day_id);
          if (foundDay) {
            const migratedDay = {
              ...foundDay,
              phases: foundDay.phases.map(migratePhaseToGroups),
            };
            setDay(migratedDay);
          }
        })
        .catch((error) => {
          console.error("Error loading plan:", error);
        });
    }
  }, [session]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completata</Badge>;
      case "in_progress":
        return <Badge variant="secondary">In corso</Badge>;
      case "interrupted":
        return <Badge variant="secondary">Interrotta</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Annullata</Badge>;
      case "no_show":
        return <Badge variant="outline">No show</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (start: string, end?: string) => {
    if (!end) return "—";
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffMs = endTime.getTime() - startTime.getTime();
    const minutes = Math.floor(diffMs / 60000);
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const getCompletedSetsForExercise = (exerciseId: string) => {
    return actuals.filter(a => a.exercise_id === exerciseId);
  };

  if (isLoading || !session) {
    return null;
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DrawerTitle>Dettaglio sessione</DrawerTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                {session.client_name}
              </div>
            </div>
            {getStatusBadge(session.status)}
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-6 py-4 space-y-6">
          {/* Info generali */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Dumbbell className="h-4 w-4" />
                    Piano
                  </div>
                  <p className="font-medium">{planName}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Giorno
                  </div>
                  <p className="font-medium">{day?.title || session.day_id}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Data
                  </div>
                  <p className="font-medium">
                    {session.started_at 
                      ? format(new Date(session.started_at), "d MMMM yyyy", { locale: it })
                      : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Durata
                  </div>
                  <p className="font-medium">
                    {session.started_at 
                      ? formatDuration(session.started_at, session.ended_at || undefined)
                      : "—"}
                  </p>
                </div>
              </div>

              {session.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Note sessione</p>
                    <p className="text-sm">{session.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Esercizi */}
          {day && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Esercizi</h3>
              
              {day.phases.map((phase: Phase) => (
                <Card key={phase.id}>
                  <CardContent className="pt-6 space-y-4">
                    <h4 className="font-medium text-primary">{phase.objective || phase.type}</h4>
                    
                    {phase.groups.map((group) => (
                      <div key={group.id} className="space-y-3">
                        {group.exercises.map((exercise) => {
                          const completedSets = getCompletedSetsForExercise(exercise.id);
                          const plannedSets = exercise.sets || 0;

                          return (
                            <div key={exercise.id} className="space-y-2 border-l-2 border-border pl-4">
                              {/* Header con badge stato */}
                              <div className="flex items-center justify-between">
                                <p className="font-medium">{exercise.name}</p>
                                <div className="flex items-center gap-2">
                                  {/* Badge serie */}
                                  <Badge 
                                    variant={
                                      completedSets.length === 0 ? "destructive" :
                                      completedSets.length < plannedSets ? "outline" :
                                      completedSets.length === plannedSets ? "default" :
                                      "secondary"
                                    }
                                  >
                                    {completedSets.length === 0 ? "Saltato" :
                                     completedSets.length < plannedSets ? `${completedSets.length}/${plannedSets} serie (meno)` :
                                     completedSets.length === plannedSets ? `${completedSets.length}/${plannedSets} serie` :
                                     `${completedSets.length}/${plannedSets} serie (extra)`}
                                  </Badge>
                                </div>
                              </div>

                              {/* Valori pianificati */}
                              <div className="bg-muted/30 rounded-md px-3 py-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1">PIANIFICATO</p>
                                <p className="text-sm">
                                  {plannedSets} x {exercise.reps} reps
                                  {exercise.load && ` × ${exercise.load}`}
                                  {exercise.rest && ` · Rest: ${exercise.rest}`}
                                </p>
                              </div>

                              {exercise.goal && (
                                <p className="text-sm text-muted-foreground">
                                  Obiettivo: {exercise.goal}
                                </p>
                              )}

                              {/* Serie effettivamente eseguite */}
                              {completedSets.length > 0 ? (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground">ESEGUITO</p>
                                  {completedSets.map((actual, idx) => {
                                    // Calcola differenze
                                    const repsDiff = actual.reps !== exercise.reps;
                                    const loadDiff = actual.load && exercise.load && actual.load !== exercise.load;
                                    const hasDifferences = repsDiff || loadDiff;
                                    
                                    return (
                                      <div 
                                        key={actual.id}
                                        className={cn(
                                          "flex items-center gap-4 text-sm rounded-md px-3 py-2",
                                          hasDifferences ? "bg-orange-50 dark:bg-orange-950/30" : "bg-muted/50"
                                        )}
                                      >
                                        <span className="font-medium">Serie {idx + 1}</span>
                                        <Separator orientation="vertical" className="h-4" />
                                        
                                        {/* Ripetizioni con indicatore differenza */}
                                        <span className={cn(repsDiff && "font-semibold text-orange-600 dark:text-orange-400")}>
                                          {actual.reps} reps
                                          {repsDiff && ` (${exercise.reps})`}
                                        </span>
                                        
                                        {/* Carico con indicatore differenza */}
                                        {actual.load && (
                                          <>
                                            <Separator orientation="vertical" className="h-4" />
                                            <span className={cn(loadDiff && "font-semibold text-orange-600 dark:text-orange-400")}>
                                              {actual.load}
                                              {loadDiff && ` (${exercise.load})`}
                                            </span>
                                          </>
                                        )}
                                        
                                        {actual.rpe && (
                                          <>
                                            <Separator orientation="vertical" className="h-4" />
                                            <span>RPE {actual.rpe}</span>
                                          </>
                                        )}
                                        
                                        {actual.note && actual.note !== "SKIPPED" && (
                                          <>
                                            <Separator orientation="vertical" className="h-4" />
                                            <span className="text-muted-foreground italic">
                                              {actual.note}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">
                                  Esercizio saltato
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
