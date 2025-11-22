/**
 * FASE 2: Toggle per cambio modalità visualizzazione - Redesigned
 */
import { Eye } from "lucide-react";
import { Label } from "@/components/ui/label";
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
}

export function CalendarViewModeToggle({
  toggleValue,
  clientSelection,
  onToggleChange,
  onClientSelectionChange,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left side: Toggle */}
        <div className="flex items-center gap-3">
          <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Label className="text-sm font-medium text-foreground whitespace-nowrap">
            Vista calendario:
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
              aria-label="Modalità Professionista"
              className="data-[state=on]:bg-primary/10 data-[state=on]:border-primary data-[state=on]:text-primary transition-all duration-150"
            >
              Professionista
            </ToggleGroupItem>
            <ToggleGroupItem
              value="client"
              aria-label="Modalità Cliente"
              className="data-[state=on]:bg-primary/10 data-[state=on]:border-primary data-[state=on]:text-primary transition-all duration-150"
            >
              Cliente
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
    </Card>
  );
}
