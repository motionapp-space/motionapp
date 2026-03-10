import { LayoutDashboard, Users, FileText, Calendar, Settings, Wallet } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  TooltipPortal,
} from "@/components/ui/tooltip";

type NavItem = { label: string; to: string; icon: React.ElementType };

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Clienti", to: "/clients", icon: Users },
  { label: "Agenda", to: "/calendar", icon: Calendar },
  { label: "Pagamenti", to: "/payments", icon: Wallet },
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
          "sticky top-0 h-screen shrink-0 bg-sidebar border-r border-sidebar-border text-sidebar-foreground flex flex-col transition-[width] duration-200 ease-in-out",
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
          <span className="text-xl font-bold tracking-tight text-sidebar-foreground">M</span>
        ) : (
          <span className="text-xl font-bold tracking-tight text-sidebar-foreground">Motion</span>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 pt-3">
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === "/dashboard"
                ? pathname === "/dashboard"
                : item.to === "/clients"
                ? pathname.startsWith("/clients") ||
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
                  "group relative flex items-center rounded-full transition-[background-color,color] duration-[120ms] ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar focus-visible:text-sidebar-foreground",
                  collapsed
                    ? "justify-center px-2 py-2.5"
                    : "gap-3 px-3 py-2.5",
                  active
                    ? "bg-sidebar-active text-sidebar-foreground font-semibold hover:bg-sidebar-active"
                    : "text-sidebar-muted hover:bg-sidebar-item-hover hover:text-sidebar-foreground"
                )}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
              >
                {/* Active indicator bar */}
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[28px] rounded-full bg-[hsl(var(--accent))]" />
                )}
                {active && collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-[hsl(var(--accent))]" />
                )}
                <Icon className="h-5 w-5 shrink-0" />
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
                  <TooltipPortal>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </TooltipPortal>
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
