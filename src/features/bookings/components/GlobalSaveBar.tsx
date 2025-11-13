import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlobalSaveBarProps {
  show: boolean;
  onSave: () => void;
  isSaving: boolean;
  error?: string;
}

export function GlobalSaveBar({ show, onSave, isSaving, error }: GlobalSaveBarProps) {
  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between py-3 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-sm font-medium">
            {error ? (
              <span className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </span>
            ) : (
              "Modifiche non salvate"
            )}
          </span>
        </div>
        <Button 
          onClick={onSave} 
          disabled={isSaving}
          size="sm"
        >
          {isSaving ? "Salvataggio..." : "Salva"}
        </Button>
      </div>
    </div>
  );
}
