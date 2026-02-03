import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FullScreenLoaderProps {
  message?: string;
  className?: string;
}

/**
 * Full screen loading spinner - matches App.tsx loading state
 */
export function FullScreenLoader({ 
  message = "Caricamento...", 
  className 
}: FullScreenLoaderProps) {
  return (
    <div className={cn(
      "flex min-h-screen items-center justify-center bg-background",
      className
    )}>
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

interface FullScreenErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * Full screen error state with retry button
 */
export function FullScreenError({
  title = "Errore di connessione",
  message = "Impossibile caricare i dati. Verifica la connessione e riprova.",
  onRetry,
  retryLabel = "Riprova",
  className,
}: FullScreenErrorProps) {
  return (
    <div className={cn(
      "flex min-h-screen items-center justify-center bg-background p-4",
      className
    )}>
      <div className="text-center max-w-md">
        <div className="rounded-full bg-destructive/10 p-3 w-fit mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
