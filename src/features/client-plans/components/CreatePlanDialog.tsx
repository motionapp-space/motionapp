import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
            <button
              onClick={handleCreateFromScratch}
              className="w-full text-left rounded-lg border bg-card text-card-foreground shadow-sm hover:border-primary transition-colors p-6 flex flex-col space-y-3"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FilePlus className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold leading-none tracking-tight">
                  {toSentenceCase("Crea da zero")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {toSentenceCase("Parti con un piano vuoto e costruiscilo completamente personalizzato")}
                </p>
              </div>
            </button>

            <button
              onClick={handleUseTemplate}
              className="w-full text-left rounded-lg border bg-card text-card-foreground shadow-sm hover:border-primary transition-colors p-6 flex flex-col space-y-3"
            >
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold leading-none tracking-tight">
                  {toSentenceCase("Usa un template")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {toSentenceCase("Parti da un template esistente e personalizzalo")}
                </p>
              </div>
            </button>
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
