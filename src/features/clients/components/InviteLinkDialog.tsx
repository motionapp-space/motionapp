import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, Check, Mail, AlertTriangle } from "lucide-react";

interface InviteLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteLink: string;
  clientName: string;
  email: string;
  expiresAt: string;
  emailSent: boolean;
  emailError?: string;
  onClose: () => void;
}

export function InviteLinkDialog({
  open,
  onOpenChange,
  inviteLink,
  clientName,
  email,
  expiresAt,
  emailSent,
  emailError,
  onClose,
}: InviteLinkDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Link copiato!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Impossibile copiare il link");
    }
  };

  const formattedExpiry = new Date(expiresAt).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Scenario A: Email inviata con successo
  if (emailSent) {
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

  // Scenario B: Email non inviata (fallback manuale)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            Cliente creato, email non inviata
          </DialogTitle>
          <DialogDescription className="pt-2">
            Il cliente <strong>{clientName}</strong> è stato creato, ma non è stato possibile inviare l'email automaticamente.
            {emailError && (
              <span className="block mt-1 text-xs text-muted-foreground">
                Errore: {emailError}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Condividi manualmente questo link con il cliente:
          </p>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={inviteLink}
              className="flex-1 font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Il link scade il <strong>{formattedExpiry}</strong>. 
                Puoi rigenerarlo dalla scheda cliente.
              </span>
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="w-full sm:w-auto"
          >
            {copied ? "Copiato!" : "Copia link"}
          </Button>
          <Button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Vai alla scheda cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
