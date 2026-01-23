import { ClientUserMenu } from "./ClientUserMenu";
import { ClientNotificationBell } from "@/features/client-notifications/components/ClientNotificationBell";

const ClientTopbar = () => {
  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-background/95 backdrop-blur-sm shadow-sm">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-foreground">Motion</span>
          <span className="text-xs text-muted-foreground">Area Cliente</span>
        </div>
        <div className="flex items-center gap-1">
          <ClientNotificationBell />
          <ClientUserMenu />
        </div>
      </div>
    </header>
  );
};

export default ClientTopbar;
