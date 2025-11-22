/**
 * FASE 2: Banner informativo per modalità preview - Redesigned
 */
import { Eye, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PREVIEW_MESSAGES } from "../utils/preview-messages";

interface CalendarPreviewBannerProps {
  isSpecificClient: boolean;
  clientName?: string;
  onBackToCoach: () => void;
}

export function CalendarPreviewBanner({ 
  isSpecificClient, 
  clientName,
  onBackToCoach 
}: CalendarPreviewBannerProps) {
  const messages = isSpecificClient && clientName
    ? PREVIEW_MESSAGES.SPECIFIC_CLIENT_BANNER(clientName)
    : PREVIEW_MESSAGES.GENERIC_CLIENT_BANNER;

  return (
    <Alert className="mb-4 border-primary/20 bg-primary/5 transition-opacity duration-200">
      <Eye className="h-4 w-4 text-primary" />
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1">
          <AlertTitle className="text-sm font-semibold text-foreground mb-1">
            {messages.title}
          </AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            {messages.description}
          </AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToCoach}
          className="gap-2 text-primary hover:text-primary hover:bg-primary/10 flex-shrink-0 self-start sm:self-center"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Torna a Professionista
        </Button>
      </div>
    </Alert>
  );
}
