import { NavLink, useLocation } from "react-router-dom";
import { Home, Dumbbell, CalendarDays } from "lucide-react";

const navItems = [
  { path: "/client/app", icon: Home, label: "Home" },
  { path: "/client/app/workouts", icon: Dumbbell, label: "Allenamenti" },
  { path: "/client/app/appointments", icon: CalendarDays, label: "Prenotazioni" },
];

const ClientBottomNav = () => {
  const location = useLocation();
  
  // Mostra la bottom nav solo nelle route /client/app/*
  if (!location.pathname.startsWith("/client/app")) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default ClientBottomNav;
