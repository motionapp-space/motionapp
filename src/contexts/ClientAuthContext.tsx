import { createContext, useContext, ReactNode } from "react";

interface ClientAuthContextValue {
  userId: string;
}

const ClientAuthContext = createContext<ClientAuthContextValue | null>(null);

export function ClientAuthProvider({ 
  userId, 
  children 
}: { 
  userId: string; 
  children: ReactNode; 
}) {
  return (
    <ClientAuthContext.Provider value={{ userId }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error("useClientAuth must be used within ClientAuthProvider");
  }
  return context;
}
