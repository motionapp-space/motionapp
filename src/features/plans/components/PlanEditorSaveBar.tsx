import { Check, Download, MoreVertical, FileOutput, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface PlanEditorSaveBarProps {
  hasChanges: boolean;
  isSaving: boolean;
  isExporting: boolean;
  canSave: boolean;
  canExport: boolean;
  showDelete: boolean;
  showSaveAsTemplate: boolean;
  showAI?: boolean;
  readonly: boolean;
  onSave: () => void;
  onExit: () => void;
  onExportPDF: () => void;
  onSaveAsTemplate: () => void;
  onDelete: () => void;
  onAIClick?: () => void;
}

export function PlanEditorSaveBar({
  hasChanges,
  isSaving,
  isExporting,
  canSave,
  canExport,
  showDelete,
  showSaveAsTemplate,
  showAI = false,
  readonly,
  onSave,
  onExit,
  onExportPDF,
  onSaveAsTemplate,
  onDelete,
  onAIClick,
}: PlanEditorSaveBarProps) {
  const showMenu = showAI || (showSaveAsTemplate && !readonly) || (showDelete && !readonly);

  const handleAIClick = () => {
    if (onAIClick) {
      onAIClick();
    } else {
      toast.info("Funzionalita' in sviluppo", {
        description: "Stiamo raccogliendo feedback: dicci se ti interessa."
      });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-14 border-t bg-background">
      <div className="container flex h-full items-center justify-between px-4 md:px-6 max-w-6xl mx-auto">
        {/* Left: Status + Exit */}
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            {hasChanges ? (
              <>
                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Modifiche non salvate
                </span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Salvato
                </span>
              </>
            )}
          </div>

          {/* Exit button */}
          <Button variant="ghost" size="sm" onClick={onExit}>
            Esci
          </Button>
        </div>

        {/* Right: PDF + Menu + Save */}
        <div className="flex items-center gap-2">
          {/* PDF button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPDF}
            disabled={!canExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>

          {/* Menu (⋮) - only show if there are menu items */}
          {showMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {showAI && (
                  <DropdownMenuItem onClick={handleAIClick} className="gap-2 justify-start">
                    <Sparkles className="h-4 w-4" />
                    AI agent
                  </DropdownMenuItem>
                )}
                {showSaveAsTemplate && !readonly && (
                  <DropdownMenuItem onClick={onSaveAsTemplate} className="gap-2 justify-start">
                    <FileOutput className="h-4 w-4" />
                    Salva come template
                  </DropdownMenuItem>
                )}
                {showDelete && !readonly && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="gap-2 text-destructive focus:text-destructive justify-start"
                  >
                    <Trash2 className="h-4 w-4" />
                    Elimina piano
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Save button */}
          <Button
            size="sm"
            onClick={onSave}
            disabled={!canSave}
          >
            {isSaving ? "Salvataggio..." : "Salva"}
          </Button>
        </div>
      </div>
    </div>
  );
}
