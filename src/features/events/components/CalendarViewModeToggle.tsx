/**
 * FASE 2: Toggle per cambio modalità visualizzazione - Redesigned + Unified
 */
import { Eye } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useClientsQuery } from "@/features/clients/hooks/useClientsQuery";
import { useMemo } from "react";

interface CalendarViewModeToggleProps {
  toggleValue: 'coach' | 'client';
  clientSelection: 'simulation' | string;
  onToggleChange: (value: 'coach' | 'client') => void;
  onClientSelectionChange: (value: 'simulation' | string) => void;
  // Nuove props per la sezione preview unificata
  showPreview: boolean;
  isSpecificClient: boolean;
  clientName?: string;
  onBackToCoach: () => void;
}

export function CalendarViewModeToggle({
  toggleValue,
  clientSelection,
  onToggleChange,
  onClientSelectionChange,
  showPreview,
  isSpecificClient,
  clientName,
  onBackToCoach,
}: CalendarViewModeToggleProps) {
  const { data: clientsData } = useClientsQuery({});
  const clients = clientsData?.items || [];

  // Validate that clientSelection exists in clients list
  const validatedClientSelection = useMemo(() => {
    if (clientSelection === 'simulation') return 'simulation';
    const clientExists = clients.some(c => c.id === clientSelection);
    return clientExists ? clientSelection : 'simulation';
  }, [clientSelection, clients]);

  // Sync if fallback happened
  if (validatedClientSelection !== clientSelection) {
    onClientSelectionChange(validatedClientSelection);
  }

  const isClientDisabled = toggleValue === 'coach';

  return (
    <Card className="border border-border rounded-lg bg-card px-4 py-3 transition-opacity duration-200">
      {/* RIGA SUPERIORE - Sempre visibile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left side: Toggle */}
        <div className="flex items-center gap-3">
          <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Label className="text-sm font-medium text-foreground whitespace-nowrap">
            Tu stai usando il calendario come:
          </Label>
          <ToggleGroup
            type="single"
            value={toggleValue}
            onValueChange={(value) => {
              if (value) onToggleChange(value as 'coach' | 'client');
            }}
            className="gap-1"
          >
            <ToggleGroupItem
              value="coach"
              aria-label="Professionista"
              className="data-[state=on]:bg-primary/10 data-[state=on]:border-primary data-[state=on]:text-primary transition-all duration-150"
            >
              Professionista
            </ToggleGroupItem>
            <ToggleGroupItem
              value="client"
              aria-label="Cliente (simulazione)"
              className="data-[state=on]:bg-primary/10 data-[state=on]:border-primary data-[state=on]:text-primary transition-all duration-150"
            >
              Cliente (simulazione)
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Right side: Client Select */}
        <div className="flex items-center gap-3">
          <Label 
            htmlFor="client-select" 
            className={`text-sm font-medium whitespace-nowrap transition-opacity duration-150 ${
              isClientDisabled ? 'text-muted-foreground' : 'text-foreground'
            }`}
          >
            Cliente:
          </Label>
          <Select
            value={validatedClientSelection}
            onValueChange={onClientSelectionChange}
            disabled={isClientDisabled}
          >
            <SelectTrigger 
              id="client-select"
              className={`w-full sm:w-[220px] transition-opacity duration-150 ${
                isClientDisabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <SelectValue placeholder="Seleziona cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simulation">Simulazione cliente</SelectItem>
              {clients.length > 0 && (
                <>
                  <SelectSeparator />
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* SEZIONE INFERIORE - Solo se showPreview === true */}
      {showPreview && (
        <div className="mt-3 pt-3 border-t border-border/40">
          <p className="text-sm font-semibold text-foreground mb-1">
            {isSpecificClient && clientName 
              ? `Simulazione vista cliente – ${clientName}`
              : 'Simulazione vista cliente attiva'}
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            Stai vedendo il calendario esattamente come lo vede {isSpecificClient ? 'questo cliente' : 'un tuo cliente quando prova a prenotare online'}. In questa modalità non puoi creare o modificare appuntamenti.
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={onBackToCoach}
            className="h-auto p-0 text-sm text-primary hover:text-primary/80"
          >
            ← Torna alla vista Professionista
          </Button>
        </div>
      )}
    </Card>
  );
}
