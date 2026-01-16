import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pause, Play, ExternalLink, Check, Trash2, FileText } from "lucide-react";
import { useSessionStore } from "@/stores/useSessionStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUpdateSession } from "@/features/sessions/hooks/useUpdateSession";
import { toast } from "sonner";

export function StickySessionBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    activeSession, 
    clearActiveSession,
    isPaused,
    pauseSession,
    resumeSession,
    getElapsedSeconds
  } = useSessionStore();
  const updateSession = useUpdateSession();
  
  const [elapsedTime, setElapsedTime] = useState("");
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const isOnLiveSessionPage = location.pathname === "/session/live";

  // Update elapsed time every second
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

  const handleBarClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons
    if ((e.target as HTMLElement).closest("button")) return;
    // Don't navigate if already on live session page
    if (isOnLiveSessionPage) return;
    
    if (activeSession) {
      navigate(`/session/live?sessionId=${activeSession.id}`);
    }
  };

  const handleComplete = async () => {
    if (!activeSession) return;
    
    try {
      await updateSession.mutateAsync({
        id: activeSession.id,
        updates: {
          status: "completed",
          ended_at: new Date().toISOString(),
        },
      });
      
      toast.success("Sessione completata");
      
      // Fade out animation
      setIsVisible(false);
      setTimeout(() => {
        clearActiveSession();
      }, 700);
    } catch (error) {
      console.error("Error completing session:", error);
    }
    
    setShowCompleteDialog(false);
  };

  const handleCancel = async () => {
    if (!activeSession) return;
    
    try {
      await updateSession.mutateAsync({
        id: activeSession.id,
        updates: {
          status: "cancelled",
          ended_at: new Date().toISOString(),
        },
      });
      
      toast.success("Sessione annullata");
      
      // Fade out animation
      setIsVisible(false);
      setTimeout(() => {
        clearActiveSession();
      }, 700);
    } catch (error) {
      console.error("Error canceling session:", error);
    }
  };

  // Show bar even on LiveSession page (removed the return null condition)
  if (!activeSession) return null;

  const clientInitials = activeSession.client_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 h-[72px] py-3 px-4 bg-background border-t border-muted shadow-[0_-2px_8px_rgba(0,0,0,0.06)] transition-opacity duration-700 ${
          isVisible ? "opacity-100" : "opacity-0"
        } ${!isOnLiveSessionPage ? "cursor-pointer" : ""}`}
        onClick={handleBarClick}
        role={!isOnLiveSessionPage ? "button" : undefined}
        tabIndex={!isOnLiveSessionPage ? 0 : undefined}
      >
        <div className="h-full max-w-[960px] mx-auto flex items-center justify-between gap-4">
          {/* Left section - Client info (hide on live page for more space) */}
          {!isOnLiveSessionPage && (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {clientInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {activeSession.client_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Sessione in corso
                </p>
              </div>
            </div>
          )}

          {/* Center section - Timer */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              {!isOnLiveSessionPage && (
                <p className="text-xs text-muted-foreground">Durata</p>
              )}
              <p className="font-mono text-[16px] font-semibold tabular-nums">{elapsedTime}</p>
            </div>
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center gap-2">
            {/* Pause/Resume */}
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={(e) => {
                e.stopPropagation();
                isPaused ? resumeSession() : pauseSession();
              }}
              title={isPaused ? "Riprendi" : "Pausa"}
            >
              {isPaused ? (
                <Play className="h-[18px] w-[18px]" />
              ) : (
                <Pause className="h-[18px] w-[18px]" />
              )}
            </Button>

            {/* Notes hint - only on live page */}
            {isOnLiveSessionPage && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-11 w-11 flex items-center justify-center text-muted-foreground">
                    <FileText className="h-[18px] w-[18px]" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Note generali a fine allenamento</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Open session - only when NOT on live page */}
            {!isOnLiveSessionPage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/session/live?sessionId=${activeSession.id}`);
                }}
                title="Apri sessione"
              >
                <ExternalLink className="h-[18px] w-[18px]" />
              </Button>
            )}

            {/* Complete - only when NOT on live page (live page has its own finish button) */}
            {!isOnLiveSessionPage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCompleteDialog(true);
                }}
                title="Completa"
              >
                <Check className="h-[18px] w-[18px]" />
              </Button>
            )}

            {/* Finish Session - primary button on live page */}
            {isOnLiveSessionPage && (
              <Button
                className="h-11 px-4 text-[14px] font-semibold rounded-[10px]"
                onClick={(e) => {
                  e.stopPropagation();
                  // Dispatch custom event to trigger finish in LiveSession
                  window.dispatchEvent(new CustomEvent('finish-session'));
                }}
              >
                Fine sessione
              </Button>
            )}

            {/* Cancel - only when NOT on live page */}
            {!isOnLiveSessionPage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                title="Annulla"
              >
                <Trash2 className="h-[18px] w-[18px]" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Completa sessione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler completare la sessione con {activeSession.client_name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>
              Completa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
