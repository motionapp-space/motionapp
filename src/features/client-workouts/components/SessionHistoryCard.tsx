import { Card, CardContent } from "@/components/ui/card";
import { SessionCompletionChart } from "./SessionCompletionChart";

interface SessionHistoryCardProps {
  title: string;
  date: string;
  completedExercises: number;
  totalExercises: number;
  onClick: () => void;
}

export function SessionHistoryCard({ 
  title, 
  date, 
  completedExercises, 
  totalExercises,
  onClick 
}: SessionHistoryCardProps) {
  return (
    <Card 
      className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground truncate">
              {title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {date}
            </p>
          </div>
          <SessionCompletionChart 
            completed={completedExercises} 
            total={totalExercises} 
            size={48}
          />
        </div>
      </CardContent>
    </Card>
  );
}
