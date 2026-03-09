import { LayoutDashboard, Users, FileText, Calendar, Settings, Wallet } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type NavItem = { label: string; to: string; icon: React.ElementType };

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Clienti", to: "/clients", icon: Users },
  { label: "Agenda", to: "/calendar", icon: Calendar },
  { label: "Pagamenti", to: "/payments", icon: Wallet },
  { label: "Libreria", to: "/library", icon: FileText },
  { label: "Impostazioni", to: "/settings", icon: Settings },
];

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const { pathname } = useLocation();

  const handleNavClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0 bg-muted border-r-0">
        <SheetHeader className="h-16 flex flex-row items-center justify-start px-5">
          <SheetTitle className="text-xl font-bold tracking-tight text-left">
            Motion
          </SheetTitle>
        </SheetHeader>
        
        <nav className="flex flex-col gap-0.5 px-2 pt-2">
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

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleNavClick}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-base leading-6 transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-offset-0",
                  "min-h-[44px]",
                  active
                    ? "bg-[hsl(var(--accent-soft-6))] border border-[hsl(var(--selection-border))] text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-[hsl(var(--accent-soft-2))] hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[28px] rounded-full bg-[hsl(var(--accent))]" />
                )}
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
