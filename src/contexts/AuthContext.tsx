import { createContext, useContext, ReactNode } from "react";
import { User } from "@supabase/supabase-js";

/**
 * Centralized auth context for the entire application.
 * Exposes ONLY user, userId, and isLoading - no business logic.
 * This eliminates redundant supabase.auth.getSession()/getUser() calls.
 */
interface AuthContextValue {
  user: User | null;
  userId: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ 
  user, 
  isLoading, 
  children 
}: { 
  user: User | null;
  isLoading: boolean;
  children: ReactNode; 
}) {
  return (
    <AuthContext.Provider value={{ 
      user, 
      userId: user?.id ?? null, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
