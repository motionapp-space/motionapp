import { Users, FileText, Calendar, Settings } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import React from "react";

type NavItem = { label: string; to: string; icon: React.ElementType };

const NAV_ITEMS: NavItem[] = [
  { label: "Clienti", to: "/", icon: Users },
  { label: "Appuntamenti", to: "/calendar", icon: Calendar },
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
      <div className="px-5 py-4">
        <div className="text-2xl font-semibold tracking-tight">Studio AI</div>
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <div className="px-2 mb-2 text-sm font-medium text-muted-foreground">Menu</div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-3 text-base leading-6 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                )}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 flex-none transition-colors",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className={cn(active ? "font-semibold" : "font-medium")}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}