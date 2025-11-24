import { Timer, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/stores/useSessionStore";
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
  const { activeSession, upcomingEvent } = useSessionStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("");

  // Update elapsed time every second for active session
  useEffect(() => {
    if (!activeSession?.started_at) return;

    const updateElapsed = () => {
      const started = new Date(activeSession.started_at!);
      const now = new Date();
      const diff = Math.floor((now.getTime() - started.getTime()) / 1000);
      
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      
      setElapsedTime(
        hours > 0 
          ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          : `${minutes}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.started_at]);

  // State 3 - Active Session
  if (activeSession) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 font-medium"
              onClick={() => navigate(`/session/live?sessionId=${activeSession.id}`)}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Sessione attiva: {activeSession.client_name}</span>
              <span className="text-muted-foreground">• {elapsedTime}</span>
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
          variant="default"
          className="gap-2"
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

  // State 1 - Idle
  return (
    <>
      <Button
        variant="default"
        className="gap-2"
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
