import { Sparkles, FileText, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface NextStepsPanelProps {
  onCreatePlan: () => void;
  onCreateAppointment: () => void;
}

export function NextStepsPanel({ onCreatePlan, onCreateAppointment }: NextStepsPanelProps) {
  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Ottimo, hai creato il tuo primo cliente!
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ora completa questi passaggi per iniziare a lavorare con Studio AI.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="default" 
                onClick={onCreatePlan}
                className="w-full justify-start h-auto p-4"
              >
                <div className="text-left w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="font-semibold">Crea un piano di allenamento</span>
                  </div>
                  <p className="text-xs opacity-90 font-normal">
                    Imposta il primo piano per uno dei tuoi clienti
                  </p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onCreateAppointment}
                className="w-full justify-start h-auto p-4"
              >
                <div className="text-left w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="font-semibold">Pianifica un appuntamento</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-normal">
                    Aggiungi una sessione al calendario
                  </p>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
