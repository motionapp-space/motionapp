import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFeedback } from "@/features/feedback/hooks/useFeedback";
import { FeedbackType } from "@/features/feedback/api/feedback.api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getSectionFromPath = (pathname: string): string => {
  if (pathname === "/" || pathname.startsWith("/clients")) return "clienti";
  if (pathname.startsWith("/calendar")) return "agenda";
  if (pathname.startsWith("/library") || pathname.startsWith("/templates")) return "libreria";
  if (pathname.startsWith("/settings")) return "impostazioni";
  if (pathname.startsWith("/notifications")) return "notifiche";
  if (pathname.startsWith("/client-plans")) return "editor-piano";
  if (pathname.startsWith("/session/live")) return "sessione-live";
  return "altro";
};

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const location = useLocation();
  const initialSection = useMemo(() => getSectionFromPath(location.pathname), [location.pathname]);
  
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [section, setSection] = useState(initialSection);
  const [message, setMessage] = useState("");
  const { sendFeedback, isLoading, reset } = useFeedback();

  // Sync section with current pathname when modal opens
  useEffect(() => {
    if (open) {
      setSection(getSectionFromPath(location.pathname));
    }
  }, [open, location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Inserisci una descrizione");
      return;
    }

    try {
      await sendFeedback({ type, section, message: message.trim() });
      toast.success("Grazie per il feedback!");
      handleClose();
    } catch (error) {
      toast.error("Errore nell'invio del feedback");
    }
  };

  const handleClose = () => {
    setType("suggestion");
    setSection(initialSection);
    setMessage("");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="space-y-1.5">
          <DialogTitle>Invia feedback</DialogTitle>
          <DialogDescription>
            Aiutaci a migliorare! Segnala un bug o suggerisci una nuova
            funzionalità.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="feedback-type">Tipo di feedback</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as FeedbackType)}
            >
              <SelectTrigger id="feedback-type">
                <SelectValue placeholder="Seleziona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="suggestion">Suggerimento</SelectItem>
                <SelectItem value="other">Altro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-section">Sezione</Label>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger id="feedback-section">
                <SelectValue placeholder="Seleziona sezione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clienti">Clienti</SelectItem>
                <SelectItem value="agenda">Agenda</SelectItem>
                <SelectItem value="libreria">Libreria</SelectItem>
                <SelectItem value="impostazioni">Impostazioni</SelectItem>
                <SelectItem value="notifiche">Notifiche</SelectItem>
                <SelectItem value="editor-piano">Editor piano</SelectItem>
                <SelectItem value="sessione-live">Sessione live</SelectItem>
                <SelectItem value="altro">Altro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-message">Descrizione</Label>
            <Textarea
              id="feedback-message"
              placeholder="Descrivi il problema o il suggerimento..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading || !message.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Invia
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
