import { useNavigate } from "react-router-dom";
import { UserX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useInactiveClients } from "../hooks/useInactiveClients";

export default function InactiveClientsCard() {
  const { data: clients, isLoading } = useInactiveClients();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3 h-full">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 h-full">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Clienti inattivi
      </h2>

      {clients && clients.length > 0 ? (
        <div className="flex flex-col gap-0.5">
          {clients.map((c) => (
            <button
              key={c.client_id}
              onClick={() => navigate(`/clients/${c.client_id}`)}
              className="flex items-center justify-between gap-2 px-3 min-h-[48px] rounded-lg text-left hover:bg-muted/50 transition-colors duration-200"
            >
              <span className="text-sm font-medium text-foreground">
                {c.first_name} {c.last_name}
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Ultimo evento: {c.days_since_last_event} giorni fa
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center py-5 space-y-2">
          <UserX className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-semibold text-foreground">
            Tutti i clienti sono attivi
          </p>
          <p className="text-sm text-muted-foreground">
            Nessun cliente inattivo da più di 30 giorni
          </p>
        </div>
      )}
    </div>
  );
}
