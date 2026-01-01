import { Users, FileText, Calendar, Settings } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import React from "react";

type NavItem = { label: string; to: string; icon: React.ElementType };

const NAV_ITEMS: NavItem[] = [
  { label: "Clienti", to: "/", icon: Users },
  { label: "Agenda", to: "/calendar", icon: Calendar },
  { label: "Libreria", to: "/library", icon: FileText },
  { label: "Impostazioni", to: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { pathname } = useLocation();

  return (
    <aside 
      className="sticky top-0 h-screen w-64 shrink-0 border-r bg-background flex flex-col" 
      data-testid="sidebar"
    >
      {/* Logo in alto */}
      <div className="h-16 flex items-center px-5">
        <span className="text-xl font-bold tracking-tight">Studio AI</span>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 pt-2">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.to === "/" 
              ? pathname === "/" || pathname.startsWith("/clients") || pathname.startsWith("/client-plans") || pathname.startsWith("/session/live")
              : item.to === "/library"
                ? pathname.startsWith("/library") || pathname.startsWith("/templates")
                : pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-base leading-6 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-muted/80 font-medium"
                )}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
              >
                {/* Barra verticale per item attivo */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary" />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 flex-none transition-colors",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}