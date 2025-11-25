import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pause, Play, ExternalLink, Check, Trash2 } from "lucide-react";
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
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const isOnLiveSessionPage = location.pathname === "/session/live";
  
  // Non mostrare la sticky bar se siamo sulla pagina LiveSession
  if (isOnLiveSessionPage) return null;

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
    
    if (activeSession) {
      navigate(`/session/live?sessionId=${activeSession.id}`);
    }
  };

  const handleComplete = async () => {
    if (!activeSession) return;
    
    const clientId = activeSession.client_id;
    
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
        
        // Se siamo sulla pagina LiveSession, naviga al dettaglio cliente
        if (isOnLiveSessionPage && clientId) {
          navigate(`/clients/${clientId}?tab=sessions`);
        }
      }, 700);
    } catch (error) {
      console.error("Error completing session:", error);
    }
    
    setShowCompleteDialog(false);
  };

  const handleCancel = async () => {
    if (!activeSession) return;
    
    const clientId = activeSession.client_id;
    
    try {
      await updateSession.mutateAsync({
        id: activeSession.id,
        updates: {
          status: "interrupted",
          ended_at: new Date().toISOString(),
        },
      });
      
      toast.success("Sessione annullata");
      
      // Fade out animation
      setIsVisible(false);
      setTimeout(() => {
        clearActiveSession();
        
        // Se siamo sulla pagina LiveSession, naviga al dettaglio cliente
        if (isOnLiveSessionPage && clientId) {
          navigate(`/clients/${clientId}?tab=sessions`);
        }
      }, 700);
    } catch (error) {
      console.error("Error canceling session:", error);
    }
    
    setShowCancelDialog(false);
  };

  if (!activeSession) return null;

  const clientInitials = activeSession.client_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 h-14 bg-primary/5 border-t backdrop-blur-sm transition-opacity duration-700 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleBarClick}
        role="button"
        tabIndex={0}
      >
        <div className="h-full px-6 flex items-center justify-between gap-4">
          {/* Left section */}
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

          {/* Center section */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Durata</p>
              <p className="font-mono font-medium">{elapsedTime}</p>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                isPaused ? resumeSession() : pauseSession();
              }}
              title={isPaused ? "Riprendi" : "Pausa"}
            >
              {isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/session/live?sessionId=${activeSession.id}`);
              }}
              title="Apri sessione"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setShowCompleteDialog(true);
              }}
              title="Completa"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setShowCancelDialog(true);
              }}
              title="Annulla"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annulla sessione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler annullare la sessione con {activeSession.client_name}?
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Torna indietro</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive hover:bg-destructive/90">
              Annulla sessione
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
