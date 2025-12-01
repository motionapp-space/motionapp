import { Outlet } from "react-router-dom";
import ClientTopbar from "./ClientTopbar";
import ClientBottomNav from "./ClientBottomNav";

const ClientAppLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ClientTopbar />
      
      <main className="flex-1 px-4 py-4 pb-20">
        <Outlet />
      </main>
      
      <ClientBottomNav />
    </div>
  );
};

export default ClientAppLayout;
