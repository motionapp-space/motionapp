import { Users, FileText, Calendar, Settings } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

type NavItem = { label: string; to: string; icon: React.ElementType };

const NAV_ITEMS: NavItem[] = [
  { label: "Clienti", to: "/", icon: Users },
  { label: "Agenda", to: "/calendar", icon: Calendar },
  { label: "Libreria", to: "/library", icon: FileText },
  { label: "Impostazioni", to: "/settings", icon: Settings },
];

interface AppSidebarProps {
  collapsed?: boolean;
  onNavClick?: () => void;
}

export function AppSidebar({ collapsed = false, onNavClick }: AppSidebarProps) {
  const { pathname } = useLocation();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "sticky top-0 h-screen shrink-0 bg-muted/30 flex flex-col transition-[width] duration-200 ease-in-out",
          collapsed ? "w-16" : "w-[232px]"
        )}
        data-testid="sidebar"
      >
      {/* Logo */}
      <div className={cn(
        "h-16 flex items-center",
        collapsed ? "justify-center px-2" : "px-5"
      )}>
        {collapsed ? (
          <span className="text-xl font-bold tracking-tight text-primary">S</span>
        ) : (
          <span className="text-xl font-bold tracking-tight">Studio AI</span>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 pt-3">
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === "/"
                ? pathname === "/" ||
                  pathname.startsWith("/clients") ||
                  pathname.startsWith("/client-plans") ||
                  pathname.startsWith("/session/live")
                : item.to === "/library"
                ? pathname.startsWith("/library") ||
                  pathname.startsWith("/templates")
                : pathname.startsWith(item.to);

            const navLinkContent = (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavClick}
                className={cn(
                  "group relative flex items-center rounded-md transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  collapsed
                    ? "justify-center px-2 py-2"
                    : "gap-3 px-3 py-2",
                  active
                    ? "bg-muted/60 text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted/30 font-medium"
                )}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
              >
                {/* Active indicator bar */}
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary/70" />
                )}
                {active && collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 rounded-r-full bg-primary/70" />
                )}
                <Icon className="h-5 w-5 flex-none" />
                {!collapsed && (
                  <span className="text-base leading-6">{item.label}</span>
                )}
              </NavLink>
            );

            // Show tooltip only when collapsed
            if (collapsed) {
              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>
                    {navLinkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return navLinkContent;
          })}
        </nav>
      </div>
      </aside>
    </TooltipProvider>
  );
}
