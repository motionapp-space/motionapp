import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

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

      toast.success("Piano assegnato");
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
    if (!selectedTemplateId || !selectedTemplate) return;
    
    // Navigate to editor with template context
    navigate(`/client-plans/new?clientId=${clientId}&templateId=${selectedTemplateId}`, {
      state: { template: selectedTemplate },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-4xl ${templates.length === 0 ? "" : "max-h-[80vh] overflow-y-auto"}`}>
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle>Seleziona un template</DialogTitle>
              <DialogDescription>
                I template ti aiutano a riutilizzare piani già pronti.
              </DialogDescription>
            </div>
            <span className="rounded-full bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground whitespace-nowrap">
              {templates.length} template
            </span>
          </div>
        </DialogHeader>

        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-muted-foreground/70" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Nessun template ancora</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Crea un template nella Libreria per riutilizzare piani già pronti con i tuoi clienti.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                onClick={() => {
                  onOpenChange(false);
                  navigate("/library?tab=templates");
                }}
              >
                Crea template
              </Button>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Torna indietro
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60">
              Puoi assegnare un template anche più tardi.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Cerca template</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="cerca per nome..."
                    className="pl-10"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Mostrando {filteredTemplates.length} template
              </p>

              <RadioGroup value={selectedTemplateId || ""} onValueChange={setSelectedTemplateId}>
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {filteredTemplates.map((template) => (
                    <Label
                      key={template.id}
                      htmlFor={template.id}
                      className="cursor-pointer"
                    >
                      <Card className={`hover:border-primary transition-colors ${
                        selectedTemplateId === template.id ? "border-primary" : ""
                      }`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{template.name}</CardTitle>
                              {template.category && (
                                <CardDescription className="flex items-center gap-1 mt-1">
                                  <Tag className="h-3 w-3" />
                                  {template.category}
                                </CardDescription>
                              )}
                            </div>
                            <RadioGroupItem value={template.id} id={template.id} />
                          </div>
                        </CardHeader>
                        {template.description && (
                          <CardContent className="pt-0">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {template.description}
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            </div>

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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
