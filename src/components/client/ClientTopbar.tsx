import { ClientUserMenu } from "./ClientUserMenu";

const ClientTopbar = () => {
  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-background/95 backdrop-blur-sm shadow-sm">
      <div className="flex h-full items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-foreground">Studio AI</span>
          <span className="text-xs text-muted-foreground">Area Cliente</span>
        </div>
        <ClientUserMenu />
      </div>
    </header>
  );
};

export default ClientTopbar;
