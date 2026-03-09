import { useNavigate } from "react-router-dom";
import { Plus, CalendarPlus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardHeader() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => navigate("/calendar")}>
        <CalendarPlus className="h-4 w-4 mr-1.5" />
        Crea evento
      </Button>
      <Button size="sm" variant="outline" onClick={() => navigate("/clients")}>
        <Plus className="h-4 w-4 mr-1.5" />
        Aggiungi cliente
      </Button>
      <Button size="sm" variant="outline" onClick={() => navigate("/payments")}>
        <Wallet className="h-4 w-4 mr-1.5" />
        Registra pagamento
      </Button>
    </div>
  );
}
