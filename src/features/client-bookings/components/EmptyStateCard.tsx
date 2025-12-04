import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClientEmptyState } from "@/components/client/ClientEmptyState";

interface EmptyStateCardProps {
  bookingEnabled: boolean;
  onBook?: () => void;
}

export function EmptyStateCard({ bookingEnabled, onBook }: EmptyStateCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <ClientEmptyState
          icon={Calendar}
          title="Non hai appuntamenti programmati"
          description={
            bookingEnabled 
              ? "Prenota il tuo prossimo appuntamento con il coach"
              : "Le nuove prenotazioni sono gestite dal tuo coach"
          }
          action={bookingEnabled && onBook ? {
            label: "Prenota un appuntamento",
            onClick: onBook,
            variant: "default"
          } : undefined}
        />
      </CardContent>
    </Card>
  );
}
