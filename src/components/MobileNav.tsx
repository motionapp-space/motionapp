import { Users, FileText, Calendar, Settings } from "lucide-react";
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
  { label: "Clienti", to: "/", icon: Users },
  { label: "Agenda", to: "/calendar", icon: Calendar },
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
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="h-16 flex items-center px-5 mb-2">
          <SheetTitle className="text-xl font-bold tracking-tight">
            Studio AI
          </SheetTitle>
        </SheetHeader>
        
        <nav className="flex flex-col gap-0.5 px-3 pt-2">
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
                  "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-base leading-6 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  "min-h-[44px]", // Touch target min 44px
                  active
                    ? "bg-muted/60 text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted/30 font-medium"
                )}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary/70" />
                )}
                <Icon className="h-5 w-5 flex-none" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
