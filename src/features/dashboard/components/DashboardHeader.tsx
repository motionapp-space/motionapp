import { useNavigate } from "react-router-dom";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardHeader() {
  const navigate = useNavigate();

  return (
    <div>
      <Button
        className="bg-foreground text-primary-foreground rounded-lg px-4 py-2.5 font-medium shadow-sm hover:bg-foreground/90"
        onClick={() => navigate("/calendar")}
      >
        <CalendarPlus className="h-4 w-4 mr-1.5" />
        Crea evento
      </Button>
    </div>
  );
}
