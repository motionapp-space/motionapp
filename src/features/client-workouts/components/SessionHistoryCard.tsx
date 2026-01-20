import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck } from "lucide-react";
import { SessionCompletionChart } from "./SessionCompletionChart";

interface SessionHistoryCardProps {
  title: string;
  date: string;
  completedExercises: number;
  totalExercises: number;
  isWithCoach?: boolean;
  onClick: () => void;
}

export function SessionHistoryCard({ 
  title, 
  date, 
  completedExercises, 
  totalExercises,
  isWithCoach,
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
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-muted-foreground">
                {date}
              </p>
              {isWithCoach && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 gap-1">
                  <UserCheck className="w-3 h-3" />
                  Con coach
                </Badge>
              )}
            </div>
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
