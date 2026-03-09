import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, ChevronRight, ArrowRight } from "lucide-react";
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
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const visible = actions?.slice(0, 3) ?? [];
  const overflow = (actions?.length ?? 0) - 3;
  const hasActions = visible.length > 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col h-full">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Azioni in sospeso
      </h2>

      {hasActions ? (
        <>
          <div className="flex flex-col gap-1">
            {visible.map((action) => (
              <button
                key={action.type}
                onClick={() => navigate(action.navigateTo)}
                className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left text-sm text-foreground hover:bg-accent/10 transition-colors duration-200"
              >
                <span>{action.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>

          {overflow > 0 && (
            <p className="text-xs text-muted-foreground px-3 mt-1">
              +{overflow} {overflow === 1 ? "altra azione" : "altre azioni"}
            </p>
          )}

          <div className="mt-auto pt-4 border-t border-border">
            <Link
              to={visible[0].navigateTo}
              className="text-sm text-accent font-medium hover:text-accent-hover transition-colors duration-200 inline-flex items-center gap-1"
            >
              Vedi dettagli
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center text-center py-6 space-y-1">
          <CheckCircle className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-foreground">
            Tutto in ordine
          </p>
          <p className="text-sm text-muted-foreground">
            Nessuna azione richiesta
          </p>
        </div>
      )}
    </div>
  );
}
