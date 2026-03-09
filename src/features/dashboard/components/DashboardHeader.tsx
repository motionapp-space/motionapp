import { useNavigate } from "react-router-dom";
import { Plus, CalendarPlus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 13) return "Buongiorno";
  if (h < 18) return "Buon pomeriggio";
  return "Buonasera";
}

export default function DashboardHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[19px] font-semibold text-foreground leading-snug">
          {getGreeting()}{name ? `, ${name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ecco la tua giornata in sintesi
        </p>
      </div>

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
    </div>
  );
}
