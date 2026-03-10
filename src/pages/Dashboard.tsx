import { useTopbar } from "@/contexts/TopbarContext";
import SectionShell from "@/components/layout/SectionShell";
import KpiStrip from "@/features/dashboard/components/KpiStrip";
import ActivityTrendCard from "@/features/dashboard/components/ActivityTrendCard";
import TodayEventsCard from "@/features/dashboard/components/TodayEventsCard";
import UpcomingEventsCard from "@/features/dashboard/components/UpcomingEventsCard";
import PendingActionsCard from "@/features/dashboard/components/PendingActionsCard";
import ClientsLowSessionsCard from "@/features/dashboard/components/ClientsLowSessionsCard";
import InactiveClientsCard from "@/features/dashboard/components/InactiveClientsCard";

export default function Dashboard() {
  useTopbar({ title: "Dashboard" });

  return (
    <SectionShell>
      <div className="space-y-6 pb-8">
        {/* Row 1 — KPI Strip */}
        <KpiStrip />

        {/* Row 2 — Ricavi 8/12 + Eventi di oggi 4/12 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <ActivityTrendCard />
          </div>
          <div className="lg:col-span-4">
            <TodayEventsCard />
          </div>
        </div>

        {/* Row 3 — Azioni in sospeso + Prossimi eventi */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PendingActionsCard />
          <UpcomingEventsCard />
        </div>

        {/* Row 4 — Pacchetti in esaurimento + Clienti inattivi */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ClientsLowSessionsCard />
          <InactiveClientsCard />
        </div>
      </div>
    </SectionShell>
  );
}
