import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function ExerciseLegend() {
  const [isOpen, setIsOpen] = useState(false);

  const legendItems = [
    { color: "bg-amber-100 dark:bg-amber-950", label: "Meno serie del previsto" },
    { color: "bg-green-100 dark:bg-green-950", label: "Serie come da piano" },
    { color: "bg-orange-100 dark:bg-orange-950", label: "Serie extra / valori diversi" },
    { color: "bg-muted border border-border", label: "Esercizio saltato" },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-5">
      <div className="h-11 px-4 rounded-[10px] bg-muted/30 flex items-center">
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <span className="text-[14px] font-medium">Legenda completamento</span>
          <ChevronDown 
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )} 
          />
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent className="pt-3 px-4">
        <div className="space-y-1">
          {legendItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3 h-6">
              <div className={cn("w-3 h-3 rounded", item.color)} />
              <span className="text-[13px]">{item.label}</span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
