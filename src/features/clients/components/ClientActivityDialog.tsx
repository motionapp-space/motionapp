import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toSentenceCase } from "@/lib/text";
import type { ClientActivity } from "@/types/client";

interface ClientActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities?: ClientActivity[];
}

export function ClientActivityDialog({ 
  open, 
  onOpenChange, 
  activities 
}: ClientActivityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{toSentenceCase("Cronologia modifiche")}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {!activities || activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {toSentenceCase("Nessuna attività")}
            </p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="border-l-2 pl-4 py-2">
                <p className="text-sm font-medium">{activity.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.created_at).toLocaleDateString("it-IT", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
