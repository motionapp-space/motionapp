import { useNavigate } from "react-router-dom";
import { CheckCircle, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePendingActions } from "../hooks/usePendingActions";

export default function PendingActionsCard() {
  const { data: actions, isLoading } = usePendingActions();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3 h-full">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col h-full">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Azioni in sospeso
      </h2>

      {actions && actions.length > 0 ? (
        <div className="flex flex-col gap-1">
          {actions.slice(0, 4).map((action) => (
            <button
              key={action.type}
              onClick={() => navigate(action.navigateTo)}
              className="flex items-center justify-between gap-2 px-3 min-h-[48px] rounded-lg text-left text-sm text-foreground hover:bg-muted/50 transition-colors duration-200"
            >
              <span>{action.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center py-5 space-y-2">
          <CheckCircle className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-semibold text-foreground">
            Tutto sotto controllo
          </p>
          <p className="text-sm text-muted-foreground">
            Non ci sono azioni da gestire
          </p>
        </div>
      )}
    </div>
  );
}
