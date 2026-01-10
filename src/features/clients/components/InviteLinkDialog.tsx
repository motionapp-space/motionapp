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
import { Copy, Check, ExternalLink } from "lucide-react";

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
  inviteLink,
  clientName,
  email,
  expiresAt,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Cliente creato con successo!
          </DialogTitle>
          <DialogDescription>
            Condividi questo link con <strong>{clientName}</strong> ({email}) per permettergli di completare la registrazione.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Il link scade il <strong>{formattedExpiry}</strong>. 
                Puoi rigenerarlo in qualsiasi momento dalla scheda cliente.
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
