import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";
import { GroupType } from "@/types/plan";

interface AddMenuProps {
  onAddExercise?: () => void;
  onAddSuperset?: () => void;
  onAddCircuit?: () => void;
  onAddDay?: () => void;
  context: "day" | "page";
  disabled?: boolean;
}

export const AddMenu = ({
  onAddExercise,
  onAddSuperset,
  onAddCircuit,
  onAddDay,
  context,
  disabled = false,
}: AddMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 h-11 min-w-[44px]"
          disabled={disabled}
          aria-label={context === "day" ? "Aggiungi contenuto" : "Aggiungi giorno"}
        >
          <Plus className="h-4 w-4" />
          <span>Aggiungi</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
        {context === "day" && (
          <>
            {onAddExercise && (
              <DropdownMenuItem 
                onClick={onAddExercise}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi esercizio
              </DropdownMenuItem>
            )}
            {onAddSuperset && (
              <DropdownMenuItem 
                onClick={onAddSuperset}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi superset (2-3 esercizi)
              </DropdownMenuItem>
            )}
            {onAddCircuit && (
              <DropdownMenuItem 
                onClick={onAddCircuit}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi circuit (3+ esercizi)
              </DropdownMenuItem>
            )}
          </>
        )}
        {context === "page" && onAddDay && (
          <DropdownMenuItem 
            onClick={onAddDay}
            className="cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi giorno
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};