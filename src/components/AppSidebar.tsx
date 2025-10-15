import { FileText, Settings, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toSentenceCase } from "@/lib/text";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Piani", url: "/plans", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Errore durante il logout");
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border flex flex-col h-full">
      <SidebarContent className="flex flex-col h-full">
        <SidebarGroup>
          <div className="flex items-center justify-between px-4 py-6">
            {!collapsed && (
              <h2 className="text-xl font-bold text-primary">PlanPal</h2>
            )}
            <SidebarTrigger className="ml-auto" />
          </div>

          <SidebarGroupLabel>{toSentenceCase("Menu")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary/10 text-primary font-semibold border-l-4 border-primary"
                          : "text-muted-foreground hover:bg-muted/40"
                      }
                      aria-current={undefined}
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{toSentenceCase(item.title)}</span>}
                          {isActive && <span className="sr-only">(current page)</span>}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spacer to push settings and logout to bottom */}
        <div className="flex-1" />

        {/* Settings section at bottom */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                      isActive
                        ? "bg-primary/10 text-primary font-semibold border-l-4 border-primary"
                        : "text-muted-foreground hover:bg-muted/40"
                    }
                    aria-current={undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <Settings className="h-4 w-4" />
                        {!collapsed && <span>{toSentenceCase("Impostazioni")}</span>}
                        {isActive && <span className="sr-only">(current page)</span>}
                      </>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span>{toSentenceCase("Esci")}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}