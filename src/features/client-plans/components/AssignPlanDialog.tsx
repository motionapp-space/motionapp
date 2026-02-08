import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Search, Tag } from "lucide-react";
import { useTemplatesQuery } from "@/features/templates/hooks/useTemplatesQuery";
import { useAssignTemplate } from "../hooks/useAssignTemplate";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

interface AssignPlanDialogProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignPlanDialog({ clientId, open, onOpenChange }: AssignPlanDialogProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const { data: templates = [] } = useTemplatesQuery();
  const assignMutation = useAssignTemplate();

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssignAsIs = async () => {
    if (!selectedTemplateId) return;

    try {
      await assignMutation.mutateAsync({
        clientId,
        input: {
          template_id: selectedTemplateId,
          personalize: false,
        },
      });

      onOpenChange(false);
      
      // Keep on Plans tab
      const sp = new URLSearchParams(searchParams);
      sp.set("tab", "plans");
      navigate(`/clients/${clientId}?${sp.toString()}`, { replace: true });
    } catch (error: any) {
      toast.error("Errore nell'assegnazione");
    }
  };

  const handlePersonalize = () => {
    if (!selectedTemplateId) return;
    
    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
    if (!selectedTemplate) return;
    
    // Navigate to editor with template context
    navigate(`/client-plans/new?clientId=${clientId}&templateId=${selectedTemplateId}`, {
      state: { template: selectedTemplate },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Seleziona un template</DialogTitle>
          <DialogDescription>
            Scegli un template da assegnare al cliente
          </DialogDescription>
        </DialogHeader>

        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="w-10 h-10 rounded-lg bg-muted/40 flex items-center justify-center">
              <FileText className="h-5 w-5 text-muted-foreground/70" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-medium">Non hai ancora creato un template</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                I template ti permettono di preparare piani di allenamento riutilizzabili e assegnarli ai tuoi clienti in pochi click.
              </p>
            </div>
            <Button
              onClick={() => {
                onOpenChange(false);
                navigate("/templates/new?mode=edit");
              }}
            >
              Crea template
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca template..."
                className="pl-10"
              />
            </div>

            {/* Template count */}
            <p className="text-xs text-muted-foreground">
              {filteredTemplates.length} template trovati
            </p>

            {/* Template list */}
            <ScrollArea className="h-[280px]">
              <RadioGroup 
                value={selectedTemplateId || ""} 
                onValueChange={setSelectedTemplateId}
                className="space-y-2 pr-4"
              >
                {filteredTemplates.map((template) => (
                  <Label
                    key={template.id}
                    htmlFor={template.id}
                    className="cursor-pointer block"
                  >
                    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:border-primary ${
                      selectedTemplateId === template.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border"
                    }`}>
                      <RadioGroupItem 
                        value={template.id} 
                        id={template.id} 
                        className="shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {template.name}
                        </p>
                        {template.category && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Tag className="h-3 w-3" />
                            {template.category}
                          </p>
                        )}
                        {template.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {template.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </ScrollArea>

            {/* Footer */}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annulla
              </Button>
              <Button
                variant="outline"
                onClick={handlePersonalize}
                disabled={!selectedTemplateId}
              >
                Personalizza
              </Button>
              <Button
                onClick={handleAssignAsIs}
                disabled={!selectedTemplateId || assignMutation.isPending}
              >
                Assegna
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
