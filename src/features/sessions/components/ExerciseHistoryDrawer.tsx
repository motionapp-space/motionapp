import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { useExerciseHistory } from "../hooks/useExerciseHistory";
import { History, TrendingUp } from "lucide-react";

interface ExerciseHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  exerciseId: string;
  exerciseName: string;
}

export function ExerciseHistoryDrawer({
  open,
  onOpenChange,
  clientId,
  exerciseId,
  exerciseName,
}: ExerciseHistoryDrawerProps) {
  const { data: history = [], isLoading } = useExerciseHistory(clientId, exerciseId, 10);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Storico performance
          </SheetTitle>
          <SheetDescription>
            Ultime 10 performance per <strong>{exerciseName}</strong>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nessuna performance registrata</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {history.map((actual, index) => (
                  <div
                    key={actual.id}
                    className="border rounded-lg p-4 space-y-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                            {index === 0 ? "Più recente" : format(parseISO(actual.timestamp), "dd MMM yyyy", { locale: it })}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Serie {actual.set_index}
                          </span>
                        </div>
                        <div className="text-sm">
                          {format(parseISO(actual.timestamp), "HH:mm", { locale: it })}
                        </div>
                      </div>
                      {index === 0 && (
                        <TrendingUp className="h-4 w-4 text-primary" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Reps:</span>
                        <span className="ml-2 font-medium">{actual.reps}</span>
                      </div>
                      {actual.load && (
                        <div>
                          <span className="text-muted-foreground">Carico:</span>
                          <span className="ml-2 font-medium">{actual.load}</span>
                        </div>
                      )}
                      {actual.rest && (
                        <div>
                          <span className="text-muted-foreground">Recupero:</span>
                          <span className="ml-2 font-medium">{actual.rest}</span>
                        </div>
                      )}
                      {actual.rpe && (
                        <div>
                          <span className="text-muted-foreground">RPE:</span>
                          <span className="ml-2 font-medium">{actual.rpe}/10</span>
                        </div>
                      )}
                    </div>

                    {actual.note && (
                      <div className="text-sm text-muted-foreground italic border-t pt-2">
                        {actual.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {history.length >= 10 && (
                <p className="text-xs text-center text-muted-foreground">
                  Mostrando le ultime 10 performance
                </p>
              )}
            </>
          )}
        </div>

        <div className="mt-6 pt-4 border-t">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Chiudi
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
