import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useSessionStore } from "@/stores/useSessionStore";
import { useUpdateSession } from "@/features/sessions/hooks/useUpdateSession";
import { getUserFullName, getUserInitials } from "@/types/user";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

export function UserMenu() {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { activeSession, clearActiveSession } = useSessionStore();
  const { mutateAsync: updateSession } = useUpdateSession();
  const { data: currentUser } = useCurrentUser();

  const handleLogoutClick = () => {
    if (activeSession) {
      setShowLogoutDialog(true);
    } else {
      performLogout();
    }
  };

  const performLogout = async () => {
    clearActiveSession();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Errore durante il logout");
    }
  };

  const handleCompleteAndLogout = async () => {
    if (!activeSession) return;
    
    try {
      await updateSession({
        id: activeSession.id,
        updates: {
          status: "completed",
          ended_at: new Date().toISOString(),
        },
      });
      toast.success("Sessione completata");
      setShowLogoutDialog(false);
      performLogout();
    } catch (error) {
      toast.error("Errore durante il completamento della sessione");
    }
  };

  const handleCancelAndLogout = async () => {
    if (!activeSession) return;
    
    try {
      await updateSession({
        id: activeSession.id,
        updates: {
          status: "discarded",
          ended_at: new Date().toISOString(),
        },
      });
      toast.success("Sessione chiusa");
      setShowLogoutDialog(false);
      performLogout();
    } catch (error) {
      toast.error("Errore durante l'annullamento della sessione");
    }
  };

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full hover:ring-2 hover:ring-primary/20 transition-all">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getUserInitials(currentUser)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Profilo e impostazioni</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium">{getUserFullName(currentUser) || "Account"}</p>
              <p className="text-xs text-muted-foreground truncate">{currentUser?.email || ""}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogoutClick} className="cursor-pointer">
            <LogOut className="h-4 w-4 mr-2" />
            Esci
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sessione in corso</AlertDialogTitle>
            <AlertDialogDescription>
              Hai una sessione attiva. Come vuoi procedere?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-col gap-2">
            <AlertDialogAction onClick={handleCompleteAndLogout} className="w-full">
              Completa sessione e esci
            </AlertDialogAction>
            <Button 
              onClick={handleCancelAndLogout} 
              variant="destructive"
              className="w-full"
            >
              Annulla sessione e esci
            </Button>
            <AlertDialogCancel className="w-full mt-0">
              Rimani connesso
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
