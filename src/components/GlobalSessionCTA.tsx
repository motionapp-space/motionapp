import { Timer, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/stores/useSessionStore";
import { useOnboardingState } from "@/features/clients/hooks/useOnboardingState";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StartSessionDialog } from "./StartSessionDialog";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function GlobalSessionCTA() {
  const navigate = useNavigate();
  const { 
    activeSession, 
    upcomingEvent, 
    isPaused, 
    getElapsedSeconds 
  } = useSessionStore();
  const { hasAnyPlan } = useOnboardingState();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("");

  // Update elapsed time every second for active session
  useEffect(() => {
    if (!activeSession?.started_at) return;

    const updateElapsed = () => {
      const seconds = getElapsedSeconds();
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      setElapsedTime(
        hours > 0 
          ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
          : `${minutes}:${secs.toString().padStart(2, '0')}`
      );
    };

    updateElapsed();
    
    if (isPaused) return;
    
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.started_at, isPaused, getElapsedSeconds]);

  // State 3 - Active Session
  if (activeSession) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 px-5 font-semibold bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-150"
              onClick={() => navigate(`/session/live?sessionId=${activeSession.id}`)}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Sessione attiva: {activeSession.client_name}</span>
              <span className="text-muted-foreground">
                • {elapsedTime} {isPaused && "(in pausa)"}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{activeSession.client_name}</p>
              <p className="text-xs text-muted-foreground">Durata: {elapsedTime}</p>
              <p className="text-xs text-muted-foreground">Click per aprire</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // State 2 - Upcoming Event (within 15 minutes)
  if (upcomingEvent) {
    const eventTime = new Date(upcomingEvent.start_at);
    const eventTimeStr = eventTime.toLocaleTimeString("it-IT", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });

    return (
      <>
        <Button
          variant="ghost"
          className="gap-2 px-5 font-semibold bg-primary/10 text-primary hover:bg-primary/20 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-150"
          onClick={() => setDialogOpen(true)}
        >
          <Timer className="h-4 w-4" />
          <div className="flex flex-col items-start gap-0">
            <span>Avvia sessione con {upcomingEvent.client_name}</span>
            <span className="text-xs opacity-80">Appuntamento alle {eventTimeStr}</span>
          </div>
        </Button>
        <StartSessionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          preselectedClientId={upcomingEvent.client_id}
          preselectedEventId={upcomingEvent.id}
        />
      </>
    );
  }

  // State 1 - Idle - Hide if no plans exist
  if (!hasAnyPlan) {
    return null;
  }
  return (
    <>
      <Button
        variant="ghost"
        className="gap-2 px-5 font-semibold bg-primary/10 text-primary hover:bg-primary/20 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-150"
        onClick={() => setDialogOpen(true)}
      >
        <Timer className="h-4 w-4" />
        Avvia sessione
      </Button>
      <StartSessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
