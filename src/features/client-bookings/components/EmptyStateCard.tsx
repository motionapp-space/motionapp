import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateCardProps {
  bookingEnabled: boolean;
  onBook?: () => void;
}

export function EmptyStateCard({ bookingEnabled, onBook }: EmptyStateCardProps) {
  return (
    <Card>
      <CardContent className="p-6 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Calendar className="h-6 w-6 text-muted-foreground" />
        </div>
        
        <div className="space-y-1">
          <p className="font-medium text-foreground">
            Non hai appuntamenti programmati
          </p>
          {!bookingEnabled && (
            <p className="text-sm text-muted-foreground">
              Le nuove prenotazioni sono gestite dal tuo coach.
            </p>
          )}
        </div>

        {bookingEnabled && onBook && (
          <Button onClick={onBook} className="w-full">
            Prenota un appuntamento
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
