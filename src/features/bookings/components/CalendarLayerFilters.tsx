import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Calendar, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CalendarLayers {
  approved: boolean;
  pending: boolean;
  ooo: boolean;
  availability: boolean;
}

interface CalendarLayerFiltersProps {
  layers: CalendarLayers;
  onToggle: (layer: keyof CalendarLayers) => void;
  pendingCount?: number;
}

export function CalendarLayerFilters({
  layers,
  onToggle,
  pendingCount = 0,
}: CalendarLayerFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={layers.approved ? "default" : "outline"}
        size="sm"
        onClick={() => onToggle("approved")}
        className="gap-2"
      >
        <Check className="h-4 w-4" />
        Approvati
      </Button>

      <Button
        variant={layers.pending ? "default" : "outline"}
        size="sm"
        onClick={() => onToggle("pending")}
        className="gap-2 relative"
      >
        <Clock className="h-4 w-4" />
        In attesa
        {pendingCount > 0 && (
          <Badge
            variant="destructive"
            className="ml-1 h-5 min-w-5 px-1 text-xs"
          >
            {pendingCount}
          </Badge>
        )}
      </Button>

      <Button
        variant={layers.ooo ? "default" : "outline"}
        size="sm"
        onClick={() => onToggle("ooo")}
        className="gap-2"
      >
        <XCircle className="h-4 w-4" />
        Fuori ufficio
      </Button>

      <Button
        variant={layers.availability ? "default" : "outline"}
        size="sm"
        onClick={() => onToggle("availability")}
        className="gap-2"
      >
        <Calendar className="h-4 w-4" />
        Disponibilità
      </Button>
    </div>
  );
}
