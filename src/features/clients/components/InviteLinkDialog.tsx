import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Mail } from "lucide-react";

interface InviteLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteLink: string;
  clientName: string;
  email: string;
  expiresAt: string;
  onClose: () => void;
}

export function InviteLinkDialog({
  open,
  onOpenChange,
  email,
  expiresAt,
  onClose,
}: InviteLinkDialogProps) {
  const formattedExpiry = new Date(expiresAt).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            Cliente creato con successo!
          </DialogTitle>
          <DialogDescription className="pt-2">
            Abbiamo inviato un'email a <strong>{email}</strong> con le istruzioni per completare la registrazione.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Il link scade il <strong>{formattedExpiry}</strong>. 
                Puoi reinviarlo in qualsiasi momento dalla scheda cliente.
              </span>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={onClose}
            className="w-full"
          >
            Vai alla scheda cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
