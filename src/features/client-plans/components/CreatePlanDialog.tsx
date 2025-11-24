import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FilePlus } from "lucide-react";
import { toSentenceCase } from "@/lib/text";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AssignPlanDialog } from "./AssignPlanDialog";

interface CreatePlanDialogProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePlanDialog({ clientId, open, onOpenChange }: CreatePlanDialogProps) {
  const navigate = useNavigate();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const handleCreateFromScratch = () => {
    navigate(`/client-plans/new?clientId=${clientId}`);
    onOpenChange(false);
  };

  const handleUseTemplate = () => {
    onOpenChange(false);
    setAssignDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{toSentenceCase("Nuovo piano di allenamento")}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 md:grid-cols-2 py-4">
            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={handleCreateFromScratch}
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <FilePlus className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{toSentenceCase("Crea da zero")}</CardTitle>
                <CardDescription className="text-sm">
                  {toSentenceCase("Parti con un piano vuoto e costruiscilo completamente personalizzato")}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={handleUseTemplate}
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-3">
                  <FileText className="h-6 w-6 text-secondary-foreground" />
                </div>
                <CardTitle className="text-lg">{toSentenceCase("Usa un template")}</CardTitle>
                <CardDescription className="text-sm">
                  {toSentenceCase("Parti da un template esistente e personalizzalo")}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {toSentenceCase("Annulla")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AssignPlanDialog
        clientId={clientId}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
      />
    </>
  );
}
