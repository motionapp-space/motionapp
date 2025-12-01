const ClientTopbar = () => {
  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-background/95 backdrop-blur-sm">
      <div className="flex h-full items-center px-4">
        <span className="text-lg font-semibold">Studio AI</span>
        <span className="ml-2 text-sm text-muted-foreground">Area Cliente</span>
      </div>
    </header>
  );
};

export default ClientTopbar;
