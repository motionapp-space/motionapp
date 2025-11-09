import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowLeft, Calendar, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClientBookingView } from "@/features/bookings/components/ClientBookingView";
import type { AvailableSlot } from "@/features/bookings/types";
import { toast } from "@/hooks/use-toast";

/**
 * Public booking page for clients to view and book available slots.
 * Mobile-first design with simplified UX.
 */
export default function ClientBooking() {
  const { coachId } = useParams<{ coachId: string }>();
  const navigate = useNavigate();
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!coachId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card>
          <CardContent className="py-8">
            <p className="text-muted-foreground">ID coach non valido</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSlotSelect = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setIsConfirming(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;

    try {
      // TODO: Implement booking API call
      // For now, just show success message
      toast({
        title: "Prenotazione confermata",
        description: `Il tuo appuntamento è stato prenotato per il ${format(
          parseISO(selectedSlot.start),
          "d MMMM yyyy 'alle' HH:mm",
          { locale: it }
        )}`,
      });

      // Reset state
      setIsConfirming(false);
      setSelectedSlot(null);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile confermare la prenotazione. Riprova.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    setIsConfirming(false);
    setSelectedSlot(null);
  };

  if (isConfirming && selectedSlot) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto space-y-4">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Conferma prenotazione
              </CardTitle>
              <CardDescription>
                Verifica i dettagli della tua sessione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border bg-muted/50">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Data</span>
                    <span className="font-medium">
                      {format(parseISO(selectedSlot.start), "EEEE d MMMM yyyy", {
                        locale: it,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Orario</span>
                    <span className="font-medium">
                      {format(parseISO(selectedSlot.start), "HH:mm")} -{" "}
                      {format(parseISO(selectedSlot.end), "HH:mm")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Durata</span>
                    <span className="font-medium">
                      {Math.round(
                        (parseISO(selectedSlot.end).getTime() -
                          parseISO(selectedSlot.start).getTime()) /
                          (1000 * 60)
                      )}{" "}
                      minuti
                    </span>
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleConfirmBooking}
              >
                <Check className="h-4 w-4 mr-2" />
                Conferma prenotazione
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        <ClientBookingView coachId={coachId} onSlotSelect={handleSlotSelect} />
      </div>
    </div>
  );
}
