import { Calendar, Users, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTodayEvents, getNextEventLabel } from "../hooks/useTodayEvents";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { useUnpaidKpi, formatCents } from "../hooks/useDashboardKpis";

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sublabel: string;
}

function KpiCard({ icon: Icon, label, value, sublabel }: KpiCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-6 w-6 text-accent" />
        <span>{label}</span>
      </div>
      <p className="text-4xl font-semibold leading-none tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      <p className="text-sm text-muted-foreground">{sublabel}</p>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export default function KpiStrip() {
  const { data: events, isLoading: eventsLoading } = useTodayEvents();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: unpaid, isLoading: unpaidLoading } = useUnpaidKpi();

  const isLoading = eventsLoading || statsLoading || unpaidLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <KpiCard
        icon={Calendar}
        label="Eventi oggi"
        value={String(events?.length ?? 0)}
        sublabel={getNextEventLabel(events)}
      />
      <KpiCard
        icon={Users}
        label="Clienti"
        value={String(stats?.totalClients ?? 0)}
        sublabel="Clienti totali"
      />
      <KpiCard
        icon={Wallet}
        label="Da incassare"
        value={formatCents(unpaid?.total ?? 0)}
        sublabel={
          unpaid?.count
            ? `${unpaid.count} ${unpaid.count === 1 ? "elemento" : "elementi"} non pagati`
            : "Tutto incassato"
        }
      />
    </div>
  );
}
