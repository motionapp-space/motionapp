import { LogOut, Mail, Phone } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCurrentClient } from "@/features/client/hooks/useCurrentClient";

export function ClientUserMenu() {
  const navigate = useNavigate();
  const { data: client, isLoading } = useCurrentClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout effettuato");
    navigate("/client/auth");
  };

  const getInitials = () => {
    if (!client) return "?";
    const firstInitial = client.first_name?.charAt(0) || "";
    const lastInitial = client.last_name?.charAt(0) || "";
    return `${firstInitial}${lastInitial}`.toUpperCase() || "?";
  };

  const fullName = client ? `${client.first_name} ${client.last_name}` : "";

  if (isLoading) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative rounded-full hover:ring-2 hover:ring-primary/20 transition-all"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Profilo</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-64">
        {/* Header con solo nome */}
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-semibold text-foreground">{fullName || "Utente"}</p>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Sezione dettagli contatto */}
        {(client?.email || client?.phone) && (
          <>
            <div className="px-3 py-2 space-y-2">
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Email</span>
                    <span className="text-sm text-foreground truncate">{client.email}</span>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Telefono</span>
                    <span className="text-sm text-foreground">{client.phone}</span>
                  </div>
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Logout */}
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Esci
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
