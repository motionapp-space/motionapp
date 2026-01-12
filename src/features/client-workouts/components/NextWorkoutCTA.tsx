import { Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface NextWorkoutCTAProps {
  title: string;
  exercisesCount?: number;
  estimatedMinutes?: number;
  status: "today" | "todo";
  onStart: () => void;
  onChangeDay: () => void;
  onViewDetail?: () => void;
  startDisabled?: boolean;
  startDisabledReason?: string;
  isLoading?: boolean;
}

export function NextWorkoutCTA({
  title,
  status,
  onStart,
  onChangeDay,
  startDisabled = true,
  startDisabledReason = "La registrazione dell'allenamento sarà disponibile a breve.",
  isLoading,
}: NextWorkoutCTAProps) {
  if (isLoading) {
    return (
      <section>
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-3">
          Prossimo allenamento
        </p>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-4 w-24 mx-auto mt-3" />
          </CardContent>
        </Card>
      </section>
    );
  }

  const handleStartClick = () => {
    if (startDisabled) {
      toast.info(startDisabledReason);
    } else {
      onStart();
    }
  };

  return (
    <section>
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-3">
        Prossimo allenamento
      </p>
      
      <Card className="shadow-sm">
        <CardContent className="p-5">
          {/* Header: Title + Badge */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-foreground truncate">
              {title}
            </h3>
            <Badge 
              variant="secondary" 
              className="bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 flex-shrink-0"
            >
              {status === "today" ? "Oggi" : "Da fare"}
            </Badge>
          </div>

          {/* Primary CTA */}
          <Button 
            className="w-full h-11"
            onClick={handleStartClick}
          >
            <Play className="w-4 h-4 mr-2 opacity-80" strokeWidth={1.5} />
            Inizia allenamento
          </Button>
          
          {/* Secondary link */}
          <button
            onClick={onChangeDay}
            className="w-full text-center text-sm text-muted-foreground hover:underline mt-3"
          >
            Cambia giorno →
          </button>
        </CardContent>
      </Card>
    </section>
  );
}
