import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, FileText } from "lucide-react";
import { ClientEmptyState } from "@/components/client/ClientEmptyState";
import type { ClientActivePlan } from "../api/client-plans.api";

interface ActivePlanCardProps {
  plan: ClientActivePlan | null | undefined;
  isLoading: boolean;
  onClick: () => void;
}

export function ActivePlanCard({ plan, isLoading, onClick }: ActivePlanCardProps) {
  if (isLoading) {
    return <Skeleton className="h-20 w-full rounded-xl" />;
  }

  if (!plan) {
    return (
      <Card className="border-dashed shadow-sm">
        <CardContent className="p-5">
          <ClientEmptyState
            icon={FileText}
            title="Nessun piano attivo"
            description="Il tuo coach non ha ancora assegnato un piano"
          />
        </CardContent>
      </Card>
    );
  }

  const daysCount = plan.data?.days?.length || 0;

  return (
    <Card 
      className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {plan.name}
            </p>
            <p className="text-[15px] leading-6 text-muted-foreground mt-0.5">
              {daysCount} {daysCount === 1 ? "giorno" : "giorni"} di allenamento
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
