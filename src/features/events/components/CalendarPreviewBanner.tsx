/**
 * FASE 2: Banner informativo per modalità preview
 */
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PREVIEW_MESSAGES } from "../utils/preview-messages";
import type { CalendarViewMode } from "../types";

interface CalendarPreviewBannerProps {
  viewMode: CalendarViewMode;
  clientName?: string;
}

export function CalendarPreviewBanner({ viewMode, clientName }: CalendarPreviewBannerProps) {
  if (viewMode === 'coach') return null;

  const message = viewMode === 'specific-client' && clientName
    ? PREVIEW_MESSAGES.BANNER_SPECIFIC_CLIENT(clientName)
    : PREVIEW_MESSAGES.BANNER_CLIENT_PREVIEW;

  return (
    <Alert className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="text-sm">
        {message}
      </AlertDescription>
    </Alert>
  );
}
