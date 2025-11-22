/**
 * FASE 2: Toggle per cambio modalità visualizzazione
 */
import { Eye } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientsQuery } from "@/features/clients/hooks/useClientsQuery";
import type { CalendarViewMode } from "../types";

interface CalendarViewModeToggleProps {
  viewMode: CalendarViewMode;
  previewClientId?: string;
  onViewModeChange: (mode: CalendarViewMode, clientId?: string) => void;
}

export function CalendarViewModeToggle({
  viewMode,
  previewClientId,
  onViewModeChange,
}: CalendarViewModeToggleProps) {
  const { data: clientsData } = useClientsQuery({});
  const clients = clientsData?.items || [];

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span>Visualizza come:</span>
      </div>

      <RadioGroup
        value={viewMode}
        onValueChange={(value) => {
          const mode = value as CalendarViewMode;
          if (mode === 'specific-client' && previewClientId) {
            onViewModeChange(mode, previewClientId);
          } else {
            onViewModeChange(mode);
          }
        }}
        className="flex items-center gap-4"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="coach" id="mode-coach" />
          <Label htmlFor="mode-coach" className="cursor-pointer font-normal">
            Professionista
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <RadioGroupItem value="client-preview" id="mode-client" />
          <Label htmlFor="mode-client" className="cursor-pointer font-normal">
            Cliente generico
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <RadioGroupItem value="specific-client" id="mode-specific" />
          <Label htmlFor="mode-specific" className="cursor-pointer font-normal">
            Cliente specifico
          </Label>
        </div>
      </RadioGroup>

      {viewMode === 'specific-client' && (
        <Select
          value={previewClientId || ""}
          onValueChange={(clientId) => onViewModeChange('specific-client', clientId)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Seleziona cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.first_name} {client.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
